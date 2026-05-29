require('dotenv').config();
const db = require('../DB/index');

const createTable = async () => {
  try {
    console.log('Conectando a la base de datos...');
    await db.sequelize.authenticate();
    console.log('Conexión establecida.');

    const query = `
      CREATE TABLE IF NOT EXISTS denuncia (
        id INTEGER NOT NULL auto_increment,
        motivo TEXT NOT NULL,
        estado ENUM('pendiente', 'notificada', 'resuelta') NOT NULL DEFAULT 'pendiente',
        fecha DATETIME NOT NULL,
        usuarioId INTEGER NOT NULL,
        fundacionId INTEGER NOT NULL,
        createdAt DATETIME,
        updatedAt DATETIME,
        PRIMARY KEY (id),
        CONSTRAINT fk_denuncia_usuario FOREIGN KEY (usuarioId) REFERENCES usuario (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_denuncia_fundacion FOREIGN KEY (fundacionId) REFERENCES fundacion (id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `;

    console.log('Ejecutando query de creación de tabla...');
    await db.sequelize.query(query);
    console.log('Tabla "denuncia" creada exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error creando la tabla:', error);
    process.exit(1);
  }
};

createTable();
