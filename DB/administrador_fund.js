module.exports = (sequelize, DataTypes) => {
  const AdminFund = sequelize.define(
    'AdminFund',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
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
      tableName: 'administrador_fundacion',
      timestamps: true,
    },
  );

  AdminFund.associate = (models) => {
    AdminFund.belongsTo(models.Usuario, {
      foreignKey: 'id',
      as: 'usuario',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    AdminFund.belongsTo(models.Fundacion, {
      foreignKey: 'fundacion_id',
      as: 'fundacion',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return AdminFund;
};
