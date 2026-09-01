/* eslint-disable no-console */
const _ = require('lodash');
const bcrypt = require('bcrypt');

const { Op } = require('sequelize');

const { USUARIO_ESTADO } = require('../constants');

const db = require('../DB/index');

/**
 * Funcion para que un admin habilite o deshabilite un usuario.
 * El booleano del cuerpo se traduce al estado del ciclo de vida: habilitar pasa
 * a ACTIVO y deshabilitar a INACTIVO.
 * @param {*} req
 * @param {*} res
 * @return {Object} response
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { habilitado } = req.body;

    // Un admin no se puede deshabilitar a sí mismo
    if (req.User.id === parseInt(usuarioId, 10)) {
      return res.status(400).send({ error: 'No puedes deshabilitar tu propia cuenta.' });
    }

    await db.Usuario.update(
      { estado: habilitado ? USUARIO_ESTADO.ACTIVO : USUARIO_ESTADO.INACTIVO },
      { where: { id: usuarioId } },
    );

    const response = {
      message: 'Estado del usuario actualizado correctamente.',
    };
    return res.send(response);
  } catch (error) {
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    return res.status(500).send(JSON.stringify(responseError));
  }
};

/**
 * Funcion para obtener la informacion de los usuarios: SuperAdmin, Admin de Fundacion y Donador
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.getInfo = async (req, res) => {
  try {
    const { id } = req.params;
    let UserInfo = await db.Usuario.findOne({
      where: { id },
      attributes: { exclude: ['password'] },
    });

    if (_.isEmpty(UserInfo)) {
      UserInfo = [];
    }
    const response = {
      result: UserInfo,
    };
    return res.send(response);
  } catch (error) {
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    return res.status(500).send(JSON.stringify(responseError));
  }
};

/**
 * Funcion para actualizar la informacion de los usuarios: SuperAdmin, Admin de Fundacion y Donador
 * en la BD
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.updateInfo = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const {
      cedula, nombres, apellidos, direccion, telefono,
    } = req.body;
    const update = {
      ...(!_.isEmpty(cedula) ? { cedula } : {}),
      ...(!_.isEmpty(nombres) ? { nombres } : {}),
      ...(!_.isEmpty(apellidos) ? { apellidos } : {}),
      ...(!_.isEmpty(telefono) ? { telefono } : {}),
      ...(!_.isEmpty(direccion) ? { direccion } : {}),
      updatedAt: Date.now(),
    };
    const UserInfo = await db.Usuario.update(update, {
      where: { id: usuarioId },
    });

    const response = {
      result: UserInfo,
    };
    return res.send(response);
  } catch (error) {
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    return res.status(500).send(JSON.stringify(responseError));
  }
};

/**
 * Funcion para actualizar la contrasena de los usuarios: SuperAdmin, Admin de Fundacion y Donador
 * @param  {*} req
 * @param  {*} res
 * @return {Object} response
 */
exports.updatePassword = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { password, newPassword } = req.body;

    const oldPassword = await db.Usuario.findOne({
      where: {
        id: usuarioId,
      },
    });

    if (!bcrypt.compareSync(password, oldPassword.password)) {
      return res.status(400).send({ error: 'Credenciales incorrectas' });
    }

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(newPassword, salt);

    const update = {
      password: hash,
      updatedAt: Date.now(),
    };
    const UserInfo = await db.Usuario.update(update, {
      where: { id: usuarioId },
    });
    const response = {
      message: 'Correo actualizado',
      result: UserInfo,
    };
    return res.send(response);
  } catch (error) {
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    return res.status(500).send(JSON.stringify(responseError));
  }
};

/**
 * Funcion para obtener todos los usuarios
 * @param {*} req
 * @param {*} res
 * @return {Object} response
 */
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const { q, role } = req.query;

    const where = {};

    if (q) {
      where[Op.or] = [
        { nombres: { [Op.like]: `%${q}%` } },
        { apellidos: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const adminCount = await db.Usuario.count({ where: { role: 1 } });
    const fundacionCount = await db.Usuario.count({ where: { role: 2 } });
    const donadorCount = await db.Usuario.count({ where: { role: 3 } });

    const { count, rows: users } = await db.Usuario.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      offset: (page - 1) * limit,
      limit,
      order: [['id', 'DESC']],
    });

    const totalPages = Math.ceil(count / limit);

    const response = {
      result: users,
      totalRows: count,
      totalPages,
      page,
      limit,
      adminCount,
      fundacionCount,
      donadorCount,
    };

    return res.send(response);
  } catch (error) {
    console.log('ERROR', error);
    const responseError = {
      message: 'Something bad happened!',
      error: error.stack,
    };
    return res.status(500).send(JSON.stringify(responseError));
  }
};
