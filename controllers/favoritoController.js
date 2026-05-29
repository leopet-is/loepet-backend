/* eslint-disable camelcase */
const { validateRequest } = require('../helpers');
const db = require('../DB/index');

exports.agregarFavorito = async (req, res) => {
  await validateRequest(req);
  try {
    const { User } = req;
    const { fundacionId } = req.params;

    // Validar que la fundación exista
    const fundacion = await db.Fundacion.findByPk(fundacionId);
    if (!fundacion) {
      return res.status(404).send({
        message: 'Fundación no encontrada.',
      });
    }

    // Verificar si ya existe el favorito
    const existente = await db.FavoritoFundacion.findOne({
      where: {
        usuario_id: User.id,
        fundacion_id: fundacionId,
      },
    });

    if (existente) {
      return res.status(400).send({
        message: 'Esta fundación ya está en tu lista de favoritos.',
      });
    }

    // Crear el favorito
    const favorito = await db.FavoritoFundacion.create({
      usuario_id: User.id,
      fundacion_id: fundacionId,
    });

    return res.send({
      message: 'Fundación agregada a favoritos correctamente.',
      result: favorito,
    });
  } catch (error) {
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    return res.status(500).send(JSON.stringify(responseError));
  }
};

exports.eliminarFavorito = async (req, res) => {
  await validateRequest(req);
  try {
    const { User } = req;
    const { fundacionId } = req.params;

    const favorito = await db.FavoritoFundacion.destroy({
      where: {
        usuario_id: User.id,
        fundacion_id: fundacionId,
      },
    });

    if (favorito === 0) {
      return res.status(404).send({
        message: 'Favorito no encontrado.',
      });
    }

    return res.send({
      message: 'Fundación eliminada de favoritos correctamente.',
    });
  } catch (error) {
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    return res.status(500).send(JSON.stringify(responseError));
  }
};

exports.obtenerFavoritos = async (req, res) => {
  await validateRequest(req);
  try {
    const { User } = req;

    const favoritos = await db.FavoritoFundacion.findAll({
      where: {
        usuario_id: User.id,
      },
      include: [
        {
          model: db.Fundacion,
          attributes: ['id', 'nombre', 'telefono', 'direccion', 'logo'],
          include: [
            {
              model: db.Usuario,
              attributes: ['email'],
            },
          ],
        },
      ],
    });

    return res.send({
      result: favoritos,
      count: favoritos.length,
    });
  } catch (error) {
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    return res.status(500).send(JSON.stringify(responseError));
  }
};

exports.verificarFavorito = async (req, res) => {
  await validateRequest(req);
  try {
    const { User } = req;
    const { fundacionId } = req.params;

    const favorito = await db.FavoritoFundacion.findOne({
      where: {
        usuario_id: User.id,
        fundacion_id: fundacionId,
      },
    });

    return res.send({
      isFavorite: !!favorito,
    });
  } catch (error) {
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    return res.status(500).send(JSON.stringify(responseError));
  }
};
