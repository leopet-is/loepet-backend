module.exports = (sequelize, DataTypes) => {
  const CuentaBancaria = sequelize.define(
    'CuentaBancaria',
    {
      banco: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      numero: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      tipo: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      fundacion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'fundacion',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      principal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    },
    {
      tableName: 'cuenta_bancaria',
      timestamps: true,
    },
  );

  CuentaBancaria.associate = (models) => {
    CuentaBancaria.belongsTo(models.Fundacion, {
      foreignKey: 'fundacion_id',
      as: 'fundacion',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return CuentaBancaria;
};
