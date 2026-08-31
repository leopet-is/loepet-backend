module.exports = (sequelize, DataTypes) => {
  const ManadaAnimal = sequelize.define(
    'ManadaAnimal',
    {
      manada_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'manada',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      animal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'animal',
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
      tableName: 'manada_animal',
      timestamps: true,
    },
  );

  ManadaAnimal.associate = (models) => {
    ManadaAnimal.belongsTo(models.Manada, {
      foreignKey: 'manada_id',
      as: 'manada',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    ManadaAnimal.belongsTo(models.Animal, {
      foreignKey: 'animal_id',
      as: 'animal',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return ManadaAnimal;
};
