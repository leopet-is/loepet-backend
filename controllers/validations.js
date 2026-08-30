const { body, param, query } = require('express-validator');

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
    .isString(),
  body('nombre')
    .exists()
    .withMessage('Es necesario el campo nombre')
    .isString(),
  body('direccion')
    .exists()
    .withMessage('Es necesario el campo direccion')
    .isString(),
  body('telefono')
    .exists()
    .withMessage('Es necesario el campo telefono')
    .isString(),
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
    .isString(),
  body('nombre_contacto')
    .exists()
    .withMessage('Es necesario el campo nombre_contacto')
    .isString(),
  body('apellido_contacto')
    .exists()
    .withMessage('Es necesario el campo apellido_contacto')
    .isString(),
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
