const { STATUS_ANIMAL, ESPECIE_ANIMAL } = require('../constants');

module.exports = (sequelize, DataTypes) => {
  const Animal = sequelize.define(
    'Animal',
    {
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      /* Estado del animal dentro de la plataforma. El ciclo de vida dejo de
       * girar en torno a la "adopcion": ahora se enmarca en el apadrinamiento
       * recurrente, por lo que la recaudacion define si requiere padrinos,
       * ya esta apadrinado, estan en tratamiento, fallecio o fue retirado. */
      status: {
        type: DataTypes.ENUM(
          'BORRADOR',
          STATUS_ANIMAL.REQUIERE_PADRINOS,
          STATUS_ANIMAL.APADRINADO,
          STATUS_ANIMAL.EN_TRATAMIENTO,
          STATUS_ANIMAL.FALLECIDO,
          STATUS_ANIMAL.INACTIVO,
        ),
        allowNull: false,
        defaultValue: STATUS_ANIMAL.REQUIERE_PADRINOS,
      },
      especie: {
        type: DataTypes.ENUM(
          ESPECIE_ANIMAL.PERRO,
          ESPECIE_ANIMAL.GATO,
          ESPECIE_ANIMAL.OTRO,
        ),
        allowNull: false,
      },
      raza: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: 'Mestizo',
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      historia: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      imagen: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      /* Galeria de fotos: siempre un arreglo (nunca null) para no romper el
       * renderizado del frontend. */
      galeria: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      /* La clave foranea se define SOLO via la asociacion (ver associate).
       * Aqui solo se declara como columna sin referencias/integridad local. */
      fundacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      visible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      /* Control financiero del apadrinamiento recurrente: la meta mensual y la
       * recaudacion en curso determinan el estado del animal (REQUIERE_PADRINOS
       * si recaudado < meta, APADRINADO si lo cubre al 100%). */
      monto_meta_mensual: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      monto_recaudado_actual: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      /* En lugar del entero "edad", se guarda una fecha de nacimiento estimada
       * para calcular la edad de forma dinamica y precisa. */
      fecha_nacimiento_estimada: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      /* DECIMAL evita la imprecision tipica de FLOAT en valores monetarios. */
      peso: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      sexo: {
        type: DataTypes.ENUM('MACHO', 'HEMBRA'),
        allowNull: false,
      },
      enfermedades: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fecha_rescate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      fecha_registro: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      esterilizacion: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      vacunacion: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      desparasitacion: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'animal',
      timestamps: true,
    },
  );

  Animal.associate = function associate(models) {
    /* La relacion con Fundacion es la unica que define la clave foranea de
     * fundacion_id (referencias, onUpdate y onDelete viven aqui). */
    Animal.belongsTo(models.Fundacion, {
      foreignKey: 'fundacion_id',
      as: 'fundacion',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    Animal.hasMany(models.ManadaAnimal, {
      foreignKey: 'animal_id',
      as: 'manadasAnimales',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Animal.hasMany(models.ActualizacionAnimal, {
      foreignKey: 'animal_id',
      as: 'actualizaciones',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Animal.hasMany(models.Donacion, {
      foreignKey: 'animal_id',
      as: 'donaciones',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Animal.hasMany(models.ComisionManada, {
      foreignKey: 'animal_id',
      as: 'comisionesManada',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
    Animal.hasMany(models.Notificacion, {
      foreignKey: 'animal_id',
      as: 'notificaciones',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return Animal;
};
