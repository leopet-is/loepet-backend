module.exports = (sequelize, DataTypes) => {
  const fundacion = sequelize.define(
    'Fundacion',
    {
      ruc: {
        type: DataTypes.STRING,
      },
      nombre: {
        type: DataTypes.STRING,
      },
      direccion: {
        type: DataTypes.STRING,
      },
      telefono: {
        type: DataTypes.STRING,
      },
      aprobado: {
        type: DataTypes.BOOLEAN,
      },
      comision: {
        type: DataTypes.DECIMAL,
      },
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
      logo: {
        type: DataTypes.STRING,
      },
      descripcion: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: 'fundacion',
    },
  );

  fundacion.associate = function associate(models) {
    fundacion.hasMany(models.Denuncia, {
      foreignKey: 'fundacionId',
      as: 'denunciasRecibidas',
    });
  };

  return fundacion;
};
