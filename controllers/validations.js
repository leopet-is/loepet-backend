const { body, param, query } = require('express-validator');

const {
  esCedulaValida,
  esRucValido,
  esTelefonoEcuador,
} = require('../utils/validators');

/* Validaciones para Animales */
module.exports.allAnimals = [
  query('especie')
    .optional()
    .isString()
    .withMessage('La especie debe ser de tipo String'),
];

module.exports.animal = [
  param('animalId')
    .exists()
    .isInt()
    .withMessage('Es necesario el campo animalId'),
];

module.exports.fundacionParam = [
  param('fundacionId')
    .exists()
    .isInt()
    .withMessage('Es necesario el campo fundacionId'),
];

module.exports.createAnimal = [
  body('nombre')
    .optional()
    .isString()
    .withMessage('El campo nombre debe ser de tipo String'),
  body('especie')
    .optional()
    .isString()
    .withMessage('El campo especie debe ser de tipo String'),
  body('raza')
    .optional()
    .isString()
    .withMessage('El campo raza debe ser de tipo String'),
  body('descripcion')
    .optional()
    .isString()
    .withMessage('El campo descripcion debe ser de tipo String'),
];

/* Validaciones para Usuarios */
module.exports.login = [
  body('email')
    .exists()
    .isString()
    .withMessage('Es necesario email'),
  body('password')
    .exists()
    .isString()
    .withMessage('Es necesario contrasena'),
];

/* Validaciones para cuentasBancarias */
module.exports.cuentaInfo = [
  param('fundacionId')
    .exists()
    .isInt()
    .withMessage('Es necesario el campo fundacionId'),
];

module.exports.cuentaId = [
  param('cuentaId')
    .exists()
    .isInt()
    .withMessage('Es necesario el campo cuentaId'),
];

module.exports.createUpdateCuentaBancaria = [
  body('banco')
    .optional()
    .isString()
    .withMessage('El campo banco debe ser de tipo String'),
  body('numero')
    .optional()
    .isString()
    .withMessage('El campo numero debe ser de tipo String'),
  body('tipo')
    .optional()
    .isString()
    .withMessage('El campo tipo debe ser de tipo String'),
  body('nombre')
    .optional()
    .isString()
    .withMessage('El campo nombre debe ser de tipo String'),
];

/* Validaciones para SolicitudFundacion */
module.exports.createSolicitudFundacion = [
  body('ruc')
    .exists()
    .withMessage('Es necesario el campo ruc')
    .trim()
    .isString()
    .matches(/^\d{13}$/)
    .withMessage('El ruc debe tener exactamente 13 digitos numericos')
    .custom((value) => esRucValido(value))
    .withMessage('El ruc no es un RUC ecuatoriano valido'),
  body('nombre')
    .exists()
    .withMessage('Es necesario el campo nombre')
    .trim()
    .isString()
    .isLength({ max: 255 })
    .withMessage('El campo nombre no puede superar 255 caracteres'),
  body('direccion')
    .exists()
    .withMessage('Es necesario el campo direccion')
    .trim()
    .isString(),
  body('telefono')
    .exists()
    .withMessage('Es necesario el campo telefono')
    .trim()
    .isString()
    .custom((value) => esTelefonoEcuador(value))
    .withMessage('El telefono debe ser un numero de Ecuador valido (movil 09XXXXXXXX o fijo 0[2-7]XXXXXXX)'),
  body('email_contacto')
    .exists()
    .withMessage('Es necesario el campo email_contacto')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('El campo email_contacto debe ser un correo electronico valido'),
  body('cedula_contacto')
    .exists()
    .withMessage('Es necesario el campo cedula_contacto')
    .trim()
    .isString()
    .custom((value) => esCedulaValida(value))
    .withMessage('La cedula de contacto no es una cedula ecuatoriana valida'),
  body('nombre_contacto')
    .exists()
    .withMessage('Es necesario el campo nombre_contacto')
    .trim()
    .isString()
    .isLength({ max: 255 })
    .withMessage('El campo nombre_contacto no puede superar 255 caracteres'),
  body('apellido_contacto')
    .exists()
    .withMessage('Es necesario el campo apellido_contacto')
    .trim()
    .isString()
    .isLength({ max: 255 })
    .withMessage('El campo apellido_contacto no puede superar 255 caracteres'),
];

/* Validaciones para crear una fundacion (rol administrador de plataforma) */
module.exports.createFundacion = [
  body('ruc')
    .exists()
    .withMessage('Es necesario el campo ruc')
    .trim()
    .isString()
    .matches(/^\d{13}$/)
    .withMessage('El ruc debe tener exactamente 13 digitos numericos')
    .custom((value) => esRucValido(value))
    .withMessage('El ruc no es un RUC ecuatoriano valido'),
  body('nombre')
    .exists()
    .withMessage('Es necesario el campo nombre')
    .trim()
    .isString()
    .isLength({ max: 255 })
    .withMessage('El campo nombre no puede superar 255 caracteres'),
  body('direccion')
    .exists()
    .withMessage('Es necesario el campo direccion')
    .trim()
    .isString(),
  body('telefono')
    .optional()
    .trim()
    .isString()
    .custom((value) => esTelefonoEcuador(value))
    .withMessage('El telefono debe ser un numero de Ecuador valido (movil 09XXXXXXXX o fijo 0[2-7]XXXXXXX)'),
  body('comision')
    .optional()
    .isNumeric()
    .withMessage('El campo comision debe ser numerico'),
  body('user_id')
    .optional()
    .isInt()
    .withMessage('El campo user_id debe ser un numero entero'),
  body('id')
    .optional()
    .isInt()
    .withMessage('El campo id (solicitud) debe ser un numero entero'),
];

/* Validaciones para actualizar la informacion de una fundacion */
module.exports.updateInfoFundacion = [
  body('ruc')
    .optional()
    .trim()
    .isString()
    .matches(/^\d{13}$/)
    .withMessage('El ruc debe tener exactamente 13 digitos numericos')
    .custom((value) => esRucValido(value))
    .withMessage('El ruc no es un RUC ecuatoriano valido'),
  body('nombre')
    .optional()
    .trim()
    .isString()
    .isLength({ max: 255 })
    .withMessage('El campo nombre no puede superar 255 caracteres'),
  body('direccion')
    .optional()
    .trim()
    .isString(),
  body('telefono')
    .optional()
    .trim()
    .isString()
    .custom((value) => esTelefonoEcuador(value))
    .withMessage('El telefono debe ser un numero de Ecuador valido (movil 09XXXXXXXX o fijo 0[2-7]XXXXXXX)'),
  body('aprobado')
    .optional()
    .isBoolean()
    .withMessage('El campo aprobado debe ser booleano'),
  body('comision')
    .optional()
    .isNumeric()
    .withMessage('El campo comision debe ser numerico'),
];

/* Validaciones para Rating */
module.exports.createRating = [
  body('valor')
    .exists()
    .withMessage('El campo valor es requerido')
    .isInt({ min: 1, max: 5 })
    .withMessage('Las estrellas deben ser un número entre 1 y 5.'),
  param('actualizacionId')
    .exists()
    .withMessage('Es necesario el campo actualizacionId')
    .isInt()
    .withMessage('El campo actualizacionId debe ser un número entero'),
];
