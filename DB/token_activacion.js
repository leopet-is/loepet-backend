module.exports = (sequelize, DataTypes) => {
  const TokenActivacion = sequelize.define(
    'TokenActivacion',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      /* Una sola cuenta pendiente por usuario: existe mientras la cuenta esta
       * en PENDIENTE_ACTIVACION y se marca como usado al activarla. */
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'usuario',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      /* Token criptografico (64 hex). Se buscara por valor en la URL de
       * activacion. */
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      /* Fecha limite para usar el enlace (24h desde su generacion). */
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      /* Se marca true al activar la cuenta para invalidar el reuso del enlace. */
      usado: {
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
      tableName: 'token_activacion',
      timestamps: true,
    },
  );

  TokenActivacion.associate = (models) => {
    TokenActivacion.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return TokenActivacion;
};
