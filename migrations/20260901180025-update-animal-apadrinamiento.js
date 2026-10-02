/** @type {import('sequelize-cli').Migration} */

// Funciones de ayuda para que la migracion sea idempotente (no falla si se
// re-ejecuta contra una base parcialmente aplicada o ya migrada).
async function columnExists(seq, table, column) {
  const [rows] = await seq.query(
    'SELECT 1 FROM information_schema.columns WHERE table_name = :table AND column_name = :col',
    { replacements: { table, col: column } },
  );
  return rows.length > 0;
}

async function typeExists(seq, type) {
  const [rows] = await seq.query(
    'SELECT 1 FROM pg_type WHERE typname = :t',
    { replacements: { t: type } },
  );
  return rows.length > 0;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const seq = queryInterface.sequelize;

    // -----------------------------------------------------------------
    // 1. Normalizar valores previos de especie antes de convertirlos en ENUM.
    //    El sistema migra de "adopcion" a "apadrinamiento recurrente": la
    //    especie pasa a un conjunto cerrado PERRO/GATO/OTRO.
    // -----------------------------------------------------------------
    await seq.query(`
      UPDATE animal SET especie = 'PERRO'
      WHERE LOWER(especie::text) IN ('perro', 'dog', 'canino', 'can');
    `);
    await seq.query(`
      UPDATE animal SET especie = 'GATO'
      WHERE LOWER(especie::text) IN ('gato', 'cat', 'felino', 'fel');
    `);
    await seq.query(`
      UPDATE animal SET especie = 'OTRO'
      WHERE especie IS NULL
         OR LOWER(especie::text) IN ('otro', 'pajaro', 'ave', 'reptil', 'pez', 'conejo', 'hamster', 'raro', 'no especificado', '')
    `);
    // Cualquier valor residual que no haya sido mapeado pasa a OTRO.
    await seq.query(`
      UPDATE animal SET especie = 'OTRO'
      WHERE especie::text NOT IN ('PERRO', 'GATO', 'OTRO');
    `);

    // -----------------------------------------------------------------
    // 2. Convertir especie a ENUM (idempotente).
    // -----------------------------------------------------------------
    if (!(await typeExists(seq, 'enum_animal_especie'))) {
      await seq.query(`
        CREATE TYPE "enum_animal_especie" AS ENUM ('PERRO', 'GATO', 'OTRO');
      `);
    }
    await seq.query(`
      ALTER TABLE "animal" ALTER COLUMN "especie" TYPE "enum_animal_especie"
      USING ("especie"::text::"enum_animal_especie");
    `);

    // -----------------------------------------------------------------
    // 3. Migrar status del esquema de "adopcion" al de "apadrinamiento".
    //    - DISPONIBLE/EN_PROCESO -> REQUIERE_PADRINOS
    //    - ADOPTADO -> INACTIVO (retirado del programa; el dato historico se
    //                  conserva aunque el ciclo de adopcion ya no aplica).
    // -----------------------------------------------------------------

    await seq.query(`ALTER TABLE "animal" ALTER COLUMN "status" DROP DEFAULT;`);

    await seq.query(`
      ALTER TABLE "animal" ALTER COLUMN "status" TYPE VARCHAR(50)
      USING ("status"::text);
    `);

    await seq.query(`
      UPDATE animal SET status = 'INACTIVO'
      WHERE status = 'ADOPTADO';
    `);
    await seq.query(`
      UPDATE animal SET status = 'REQUIERE_PADRINOS'
      WHERE status IS NULL
         OR status::text NOT IN ('REQUIERE_PADRINOS', 'APADRINADO', 'EN_TRATAMIENTO', 'FALLECIDO', 'INACTIVO');
    `);

    // -----------------------------------------------------------------
    // 4. Convertir status a ENUM de 5 valores (idempotente).
    // -----------------------------------------------------------------
    await seq.query(`DROP TYPE IF EXISTS "enum_animal_status";`);

    await seq.query(`
      CREATE TYPE "enum_animal_status" AS ENUM (
        'REQUIERE_PADRINOS', 'APADRINADO', 'EN_TRATAMIENTO', 'FALLECIDO', 'INACTIVO'
      );
    `);

    await seq.query(`
      ALTER TABLE "animal" ALTER COLUMN "status" TYPE "enum_animal_status"
      USING ("status"::text::"enum_animal_status");
    `);
    await seq.query(`
      ALTER TABLE "animal" ALTER COLUMN "status" SET DEFAULT 'REQUIERE_PADRINOS';
    `);
    await seq.query(`
      ALTER TABLE "animal" ALTER COLUMN "status" SET NOT NULL;
    `);

    // -----------------------------------------------------------------
    // 5. Control financiero mensual del apadrinamiento recurrente.
    // -----------------------------------------------------------------
    if (!(await columnExists(seq, 'animal', 'monto_meta_mensual'))) {
      await queryInterface.addColumn('animal', 'monto_meta_mensual', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      });
    }
    if (!(await columnExists(seq, 'animal', 'monto_recaudado_actual'))) {
      await queryInterface.addColumn('animal', 'monto_recaudado_actual', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      });
    }

    // -----------------------------------------------------------------
    // 6. Reemplazar el entero "edad" por una fecha de nacimiento estimada.
    // -----------------------------------------------------------------
    if (!(await columnExists(seq, 'animal', 'fecha_nacimiento_estimada'))) {
      await queryInterface.addColumn('animal', 'fecha_nacimiento_estimada', {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }
    if (await columnExists(seq, 'animal', 'edad')) {
      await queryInterface.removeColumn('animal', 'edad');
    }

    // -----------------------------------------------------------------
    // 7. Conversion de peso: FLOAT -> DECIMAL(5,2).
    // -----------------------------------------------------------------
    await seq.query(`
      ALTER TABLE "animal" ALTER COLUMN "peso" TYPE DECIMAL(5,2)
      USING ("peso"::numeric);
    `);

    // -----------------------------------------------------------------
    // 8. Galeria: nunca null (arreglo por defecto).
    // -----------------------------------------------------------------
    await seq.query('UPDATE animal SET galeria = \'[]\' WHERE galeria IS NULL;');
    await seq.query(`
      ALTER TABLE "animal" ALTER COLUMN "galeria" TYPE json
      USING ("galeria"::json);
    `);
    await seq.query(`
      ALTER TABLE "animal" ALTER COLUMN "galeria" SET DEFAULT '[]'::json;
    `);
    await seq.query(`
      ALTER TABLE "animal" ALTER COLUMN "galeria" SET NOT NULL;
    `);

    // 9. Raza por defecto "Mestizo".
    await seq.query(`
      ALTER TABLE "animal" ALTER COLUMN "raza" SET DEFAULT 'Mestizo';
    `);
  },

  async down(queryInterface, Sequelize) {
    const seq = queryInterface.sequelize;

    // Revertir raza
    await seq.query('ALTER TABLE "animal" ALTER COLUMN "raza" DROP DEFAULT;');

    // Revertir galeria a nullable
    await seq.query(`
      ALTER TABLE "animal" ALTER COLUMN "galeria" DROP NOT NULL;
    `);
    await seq.query(`
      ALTER TABLE "animal" ALTER COLUMN "galeria" DROP DEFAULT;
    `);
    await seq.query(`
      ALTER TABLE "animal" ALTER COLUMN "galeria" TYPE json
      USING ("galeria"::json);
    `);

    // Revertir peso a FLOAT
    await seq.query('ALTER TABLE "animal" ALTER COLUMN "peso" TYPE double precision;');

    // Quitar control financiero y fecha de nacimiento
    if (await columnExists(seq, 'animal', 'fecha_nacimiento_estimada')) {
      await queryInterface.removeColumn('animal', 'fecha_nacimiento_estimada');
    }
    if (await columnExists(seq, 'animal', 'monto_recaudado_actual')) {
      await queryInterface.removeColumn('animal', 'monto_recaudado_actual');
    }
    if (await columnExists(seq, 'animal', 'monto_meta_mensual')) {
      await queryInterface.removeColumn('animal', 'monto_meta_mensual');
    }

    // Restaurar "edad" (entero, sin datos recuperables)
    if (!(await columnExists(seq, 'animal', 'edad'))) {
      await queryInterface.addColumn('animal', 'edad', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    // Revertir status a ENUM de adopcion
    await seq.query(`
      UPDATE animal SET status = 'DISPONIBLE'
      WHERE status IS NULL
         OR status::text NOT IN ('DISPONIBLE', 'EN_PROCESO', 'ADOPTADO');
    `);
    if (!(await typeExists(seq, 'enum_animal_status_adopcion'))) {
      await seq.query(`
        CREATE TYPE "enum_animal_status_adopcion" AS ENUM ('DISPONIBLE', 'EN_PROCESO', 'ADOPTADO');
      `);
    }
    await seq.query(`
      ALTER TABLE "animal" ALTER COLUMN "status" TYPE "enum_animal_status_adopcion"
      USING ("status"::text::"enum_animal_status_adopcion");
    `);
    await seq.query(`
      ALTER TABLE "animal" ALTER COLUMN "status" SET DEFAULT 'DISPONIBLE';
    `);
    // Limpiar el tipo nuevo (opcional; se conserva si se re-sube a la version vieja)
    await seq.query('DROP TYPE IF EXISTS "enum_animal_status";');

    // Revertir especie a STRING
    if (!(await typeExists(seq, 'enum_animal_especie_str'))) {
      await seq.query(`
        CREATE TYPE "enum_animal_especie_str" AS ENUM ('PERRO', 'GATO', 'OTRO');
      `);
    }
    await seq.query(`
      ALTER TABLE "animal" ALTER COLUMN "especie" TYPE character varying(50)
      USING ("especie"::text);
    `);
    // Limpiar el tipo nuevo
    await seq.query('DROP TYPE IF EXISTS "enum_animal_especie";');
  },
};
