/* Modelo para los metadatos y respuestas de la pasarela de pagos vinculadas a
 * la suscripcion de una manada. Antes estos campos vivian en manada; con la
 * refactorizacion se desacoplan hacia una entidad propia de apadrinamiento. */
module.exports = (sequelize, DataTypes) => {
  const SuscripcionPadrino = sequelize.define(
    'SuscripcionPadrino',
    {
      manadaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      montoTotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      statusSubscription: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      productId: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      responseProduct: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      planId: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      responsePlan: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      subscriptionId: {
        type: DataTypes.STRING(191),
        allowNull: true,
      },
      responseSubscription: {
        type: DataTypes.JSON,
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
      tableName: 'suscripcion_padrino',
      timestamps: true,
    },
  );

  SuscripcionPadrino.associate = function associate(models) {
    SuscripcionPadrino.belongsTo(models.Manada, {
      foreignKey: 'manadaId',
      as: 'manada',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return SuscripcionPadrino;
};
