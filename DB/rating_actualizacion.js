/* Modelo para las calificaciones que un padrino otorga a una actualizacion (o
 * evidencia) publicada por la fundacion sobre un animal de su manada. Un mismo
 * usuario no puede calificar dos veces la misma actualizacion (ver indice
 * unico =actualizacionId, userId=). */
module.exports = (sequelize, DataTypes) => {
  const RatingActualizacion = sequelize.define(
    'RatingActualizacion',
    {
      actualizacionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      /* Calificacion en estrellas: entre 1 y 5. */
      estrellas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      comentario: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      tableName: 'rating_actualizacion',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['actualizacionId', 'userId'],
          name: 'rating_actualizacion_actualizacion_usuario_uniq',
        },
      ],
    },
  );

  RatingActualizacion.associate = function associate(models) {
    RatingActualizacion.belongsTo(models.ActualizacionAnimal, {
      foreignKey: 'actualizacionId',
      as: 'actualizacion',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
    RatingActualizacion.belongsTo(models.Usuario, {
      foreignKey: 'userId',
      as: 'usuario',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return RatingActualizacion;
};
