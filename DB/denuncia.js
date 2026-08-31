module.exports = (sequelize, DataTypes) => {
  const Denuncia = sequelize.define(
    'Denuncia',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      motivo: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      archivos: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      estado: {
        type: DataTypes.ENUM('pendiente', 'notificada', 'resuelta', 'rechazada'),
        defaultValue: 'pendiente',
        allowNull: false,
      },
      motivo_rechazo: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'usuario',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      fundacionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'fundacion',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    },
    {
      tableName: 'denuncia',
      timestamps: true,
    },
  );

  Denuncia.associate = function associate(models) {
    Denuncia.belongsTo(models.Usuario, {
      foreignKey: 'usuarioId',
      as: 'donador',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    Denuncia.belongsTo(models.Fundacion, {
      foreignKey: 'fundacionId',
      as: 'fundacion',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return Denuncia;
};
