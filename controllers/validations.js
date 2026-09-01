const {
  body,
  param,
  query,
  validationResult,
} = require('express-validator');

const {
  esCedulaValida,
  esRucValido,
  esTelefonoEcuador,
} = require('../utils/validators');

/* Middleware que evalúa el resultado de las validaciones y corta la petición
 * con un 400 Bad Request cuando algún campo es inválido. */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      errors: errors.array().map((error) => ({
        campo: error.param,
        mensaje: error.msg,
      })),
    });
  }
  return next();
};

/* Validaciones para Animales */
module.exports.allAnimals = [
  query('especie')
    .optional()
    .isString()
    .withMessage('La especie debe ser de tipo String'),
  validate,
];

module.exports.animal = [
  param('animalId')
    .exists()
    .isInt()
    .withMessage('Es necesario el campo animalId'),
  validate,
];

module.exports.fundacionParam = [
  param('fundacionId')
    .exists()
    .isInt()
    .withMessage('Es necesario el campo fundacionId'),
  validate,
];

/* Validaciones para crear un Animal (rol administrador de fundacion).
 * Se exigen los campos que el modelo define como obligatorios (allowNull: false
 * y sin defaultValue). fundacion_id, status, visible y los flags booleans tienen
 * defaultValue o se derivan en el controlador, por lo que no se exigen aqui. */
module.exports.createAnimal = [
  body('nombre')
    .exists()
    .withMessage('El campo nombre es obligatorio')
    .isString()
    .withMessage('El campo nombre debe ser de tipo String')
    .trim()
    .isLength({ max: 100 })
    .withMessage('El campo nombre no puede superar 100 caracteres'),
  body('especie')
    .exists()
    .withMessage('El campo especie es obligatorio')
    .isString()
    .withMessage('El campo especie debe ser de tipo String')
    .trim()
    .isLength({ max: 50 })
    .withMessage('El campo especie no puede superar 50 caracteres'),
  body('sexo')
    .exists()
    .withMessage('El campo sexo es obligatorio')
    .isIn(['MACHO', 'HEMBRA'])
    .withMessage('El campo sexo debe ser MACHO o HEMBRA'),
  body('raza')
    .optional()
    .isString()
    .withMessage('El campo raza debe ser de tipo String')
    .trim()
    .isLength({ max: 50 })
    .withMessage('El campo raza no puede superar 50 caracteres'),
  body('descripcion')
    .optional()
    .isString()
    .withMessage('El campo descripcion debe ser de tipo String'),
  body('status')
    .optional()
    .isIn(['DISPONIBLE', 'EN_PROCESO', 'ADOPTADO'])
    .withMessage('El campo status debe ser uno de: DISPONIBLE, EN_PROCESO, ADOPTADO'),
  body('peso')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El campo peso debe ser un número (kg) mayor o igual a 0')
    .toFloat(),
  body('edad')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El campo edad debe ser un número entero mayor o igual a 0')
    .toInt(),
  body('fecha_rescate')
    .optional()
    .isISO8601({ strict: true })
    .withMessage('El campo fecha_rescate debe ser una fecha valida (YYYY-MM-DD)'),
  body('fecha_registro')
    .optional()
    .isISO8601({ strict: true })
    .withMessage('El campo fecha_registro debe ser una fecha valida (YYYY-MM-DD)'),
  body('esterilizacion')
    .optional()
    .isBoolean()
    .withMessage('El campo esterilizacion debe ser booleano'),
  body('vacunacion')
    .optional()
    .isBoolean()
    .withMessage('El campo vacunacion debe ser booleano'),
  body('desparasitacion')
    .optional()
    .isBoolean()
    .withMessage('El campo desparasitacion debe ser booleano'),
  validate,
];

/* Validaciones para actualizar un Animal: mismos campos que createAnimal pero
 * todos opcionales para permitir actualizaciones parciales. */
module.exports.updateAnimal = [
  body('nombre')
    .optional()
    .isString()
    .withMessage('El campo nombre debe ser de tipo String')
    .trim()
    .isLength({ max: 100 })
    .withMessage('El campo nombre no puede superar 100 caracteres'),
  body('especie')
    .optional()
    .isString()
    .withMessage('El campo especie debe ser de tipo String')
    .trim()
    .isLength({ max: 50 })
    .withMessage('El campo especie no puede superar 50 caracteres'),
  body('sexo')
    .optional()
    .isIn(['MACHO', 'HEMBRA'])
    .withMessage('El campo sexo debe ser MACHO o HEMBRA'),
  body('raza')
    .optional()
    .isString()
    .withMessage('El campo raza debe ser de tipo String')
    .trim()
    .isLength({ max: 50 })
    .withMessage('El campo raza no puede superar 50 caracteres'),
  body('descripcion')
    .optional()
    .isString()
    .withMessage('El campo descripcion debe ser de tipo String'),
  body('status')
    .optional()
    .isIn(['DISPONIBLE', 'EN_PROCESO', 'ADOPTADO'])
    .withMessage('El campo status debe ser uno de: DISPONIBLE, EN_PROCESO, ADOPTADO'),
  body('peso')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El campo peso debe ser un número (kg) mayor o igual a 0')
    .toFloat(),
  body('edad')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El campo edad debe ser un número entero mayor o igual a 0')
    .toInt(),
  body('fecha_rescate')
    .optional()
    .isISO8601({ strict: true })
    .withMessage('El campo fecha_rescate debe ser una fecha valida (YYYY-MM-DD)'),
  body('fecha_registro')
    .optional()
    .isISO8601({ strict: true })
    .withMessage('El campo fecha_registro debe ser una fecha valida (YYYY-MM-DD)'),
  body('esterilizacion')
    .optional()
    .isBoolean()
    .withMessage('El campo esterilizacion debe ser booleano'),
  body('vacunacion')
    .optional()
    .isBoolean()
    .withMessage('El campo vacunacion debe ser booleano'),
  body('desparasitacion')
    .optional()
    .isBoolean()
    .withMessage('El campo desparasitacion debe ser booleano'),
  validate,
];

/* Validaciones para Usuarios */
module.exports.login = [
  body('email')
    .exists()
    .isString()
    .withMessage('Es necesario email')
    .trim()
    .isEmail()
    .withMessage('El email debe ser un correo electronico valido'),
  body('password')
    .exists()
    .isString()
    .withMessage('Es necesario contrasena'),
  validate,
];

/* Validaciones para crear una cuenta bancaria (POST): se exigen los campos
 * que el modelo define como obligatorios (allowNull: false). */
module.exports.createCuentaBancaria = [
  body('banco')
    .exists()
    .withMessage('El campo banco es obligatorio')
    .isString()
    .withMessage('El campo banco debe ser de tipo String')
    .trim()
    .isLength({ max: 50 })
    .withMessage('El campo banco no puede superar 50 caracteres'),
  body('numero')
    .exists()
    .withMessage('El campo numero es obligatorio')
    .isString()
    .withMessage('El campo numero debe ser de tipo String')
    .trim()
    .isLength({ max: 30 })
    .withMessage('El campo numero no puede superar 30 caracteres')
    .isNumeric()
    .withMessage('El campo numero debe contener solo digitos'),
  body('tipo')
    .exists()
    .withMessage('El campo tipo es obligatorio')
    .isString()
    .withMessage('El campo tipo debe ser de tipo String')
    .trim()
    .isLength({ max: 20 })
    .withMessage('El campo tipo no puede superar 20 caracteres'),
  body('nombre')
    .exists()
    .withMessage('El campo nombre es obligatorio')
    .isString()
    .withMessage('El campo nombre debe ser de tipo String')
    .trim()
    .isLength({ max: 150 })
    .withMessage('El campo nombre no puede superar 150 caracteres'),
  body('fundacionId')
    .exists()
    .withMessage('El campo fundacionId es obligatorio')
    .isInt()
    .withMessage('El campo fundacionId debe ser un numero entero'),
  validate,
];

/* Validaciones para actualizar/eliminar una cuenta bancaria: los campos de
 * banco/tipo/nombre son opcionales para permitir actualizaciones parciales. */
module.exports.updateCuentaBancaria = [
  body('banco')
    .optional()
    .isString()
    .withMessage('El campo banco debe ser de tipo String')
    .trim()
    .isLength({ max: 50 })
    .withMessage('El campo banco no puede superar 50 caracteres'),
  body('numero')
    .optional()
    .isString()
    .withMessage('El campo numero debe ser de tipo String')
    .trim()
    .isLength({ max: 30 })
    .withMessage('El campo numero no puede superar 30 caracteres')
    .isNumeric()
    .withMessage('El campo numero debe contener solo digitos'),
  body('tipo')
    .optional()
    .isString()
    .withMessage('El campo tipo debe ser de tipo String')
    .trim()
    .isLength({ max: 20 })
    .withMessage('El campo tipo no puede superar 20 caracteres'),
  body('nombre')
    .optional()
    .isString()
    .withMessage('El campo nombre debe ser de tipo String')
    .trim()
    .isLength({ max: 150 })
    .withMessage('El campo nombre no puede superar 150 caracteres'),
  validate,
];

/* Validaciones para cuentasBancarias */
module.exports.cuentaInfo = [
  param('fundacionId')
    .exists()
    .isInt()
    .withMessage('Es necesario el campo fundacionId'),
  validate,
];

module.exports.cuentaId = [
  param('cuentaId')
    .exists()
    .isInt()
    .withMessage('Es necesario el campo cuentaId'),
  validate,
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
  validate,
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
    .notEmpty()
    .withMessage('El campo nombre no puede estar vacio')
    .isLength({ max: 150 })
    .withMessage('El campo nombre no puede superar 150 caracteres'),
  body('direccion')
    .exists()
    .withMessage('Es necesario el campo direccion')
    .trim()
    .isString()
    .notEmpty()
    .withMessage('El campo direccion no puede estar vacio')
    .isLength({ max: 200 })
    .withMessage('El campo direccion no puede superar 200 caracteres'),
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
    .notEmpty()
    .withMessage('El campo nombre_contacto no puede estar vacio')
    .isLength({ max: 100 })
    .withMessage('El campo nombre_contacto no puede superar 100 caracteres'),
  body('apellido_contacto')
    .exists()
    .withMessage('Es necesario el campo apellido_contacto')
    .trim()
    .isString()
    .notEmpty()
    .withMessage('El campo apellido_contacto no puede estar vacio')
    .isLength({ max: 100 })
    .withMessage('El campo apellido_contacto no puede superar 100 caracteres'),
  validate,
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
    .notEmpty()
    .withMessage('El campo nombre no puede estar vacio')
    .isLength({ max: 150 })
    .withMessage('El campo nombre no puede superar 150 caracteres'),
  body('direccion')
    .exists()
    .withMessage('Es necesario el campo direccion')
    .trim()
    .isString()
    .notEmpty()
    .withMessage('El campo direccion no puede estar vacio')
    .isLength({ max: 200 })
    .withMessage('El campo direccion no puede superar 200 caracteres'),
  body('telefono')
    .optional()
    .trim()
    .isString()
    .custom((value) => esTelefonoEcuador(value))
    .withMessage('El telefono debe ser un numero de Ecuador valido (movil 09XXXXXXXX o fijo 0[2-7]XXXXXXX)'),
  body('comision')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('El campo comision debe ser un porcentaje entre 0 y 100'),
  body('user_id')
    .optional()
    .isInt()
    .withMessage('El campo user_id debe ser un numero entero'),
  body('id')
    .optional()
    .isInt()
    .withMessage('El campo id (solicitud) debe ser un numero entero'),
  validate,
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
    .isLength({ max: 150 })
    .withMessage('El campo nombre no puede superar 150 caracteres'),
  body('direccion')
    .optional()
    .trim()
    .isString()
    .isLength({ max: 200 })
    .withMessage('El campo direccion no puede superar 200 caracteres'),
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
    .isFloat({ min: 0, max: 100 })
    .withMessage('El campo comision debe ser un porcentaje entre 0 y 100'),
  validate,
];

/* Validaciones para Rating */
module.exports.createRating = [
  body('valor')
    .exists()
    .withMessage('El campo valor es requerido')
    .isFloat({ min: 1, max: 5 })
    .withMessage('La calificacion debe ser un número entre 1 y 5.'),
  param('actualizacionId')
    .exists()
    .withMessage('Es necesario el campo actualizacionId')
    .isInt()
    .withMessage('El campo actualizacionId debe ser un número entero'),
  validate,
];

/* Validaciones para Donaciones */
module.exports.crearDonacion = [
  body('manadaId')
    .exists()
    .withMessage('Es necesario el campo manadaId')
    .isInt()
    .withMessage('El campo manadaId debe ser un numero entero'),
  validate,
];

module.exports.donacionIdParam = [
  param('donacionId')
    .exists()
    .withMessage('Es necesario el campo donacionId')
    .isInt()
    .withMessage('El campo donacionId debe ser un numero entero'),
  validate,
];

module.exports.aprobarDonacion = [
  body('aprobado')
    .exists()
    .withMessage('Es necesario el campo aprobado')
    .isBoolean()
    .withMessage('El campo aprobado debe ser booleano'),
  param('donacionId')
    .exists()
    .withMessage('Es necesario el campo donacionId')
    .isInt()
    .withMessage('El campo donacionId debe ser un numero entero'),
  validate,
];

module.exports.pagarDonacion = [
  body('status')
    .exists()
    .withMessage('Es necesario el campo status')
    .isString()
    .withMessage('El campo status debe ser de tipo String'),
  param('donacionId')
    .exists()
    .withMessage('Es necesario el campo donacionId')
    .isInt()
    .withMessage('El campo donacionId debe ser un numero entero'),
  validate,
];

/* Validaciones para Evidencias */
module.exports.crearEvidencia = [
  body('donacion')
    .exists()
    .withMessage('Es necesario el campo donacion')
    .isInt()
    .withMessage('El campo donacion debe ser un numero entero'),
  body('descripcion')
    .optional()
    .isString()
    .withMessage('El campo descripcion debe ser de tipo String'),
  validate,
];

module.exports.updateEvidencia = [
  body('descripcion')
    .optional()
    .isString()
    .withMessage('El campo descripcion debe ser de tipo String'),
  body('galeria')
    .optional()
    .isObject()
    .withMessage('El campo galeria debe ser un objeto'),
  param('evidenciaId')
    .exists()
    .withMessage('Es necesario el campo evidenciaId')
    .isInt()
    .withMessage('El campo evidenciaId debe ser un numero entero'),
  validate,
];

/* Validaciones para Actualizaciones de Animal */
module.exports.createActualizacion = [
  body('animal_id')
    .exists()
    .withMessage('Es necesario el campo animal_id')
    .isInt()
    .withMessage('El campo animal_id debe ser un numero entero'),
  body('fundacion_id')
    .exists()
    .withMessage('Es necesario el campo fundacion_id')
    .isInt()
    .withMessage('El campo fundacion_id debe ser un numero entero'),
  body('descripcion')
    .optional()
    .isString()
    .withMessage('El campo descripcion debe ser de tipo String'),
  body('estado_salud')
    .optional()
    .isString()
    .withMessage('El campo estado_salud debe ser de tipo String')
    .trim()
    .isLength({ max: 50 })
    .withMessage('El campo estado_salud no puede superar 50 caracteres'),
  body('fecha')
    .optional()
    .isISO8601()
    .withMessage('El campo fecha debe ser una fecha valida'),
  validate,
];

module.exports.updateActualizacion = [
  body('descripcion')
    .optional()
    .isString()
    .withMessage('El campo descripcion debe ser de tipo String'),
  body('estado_salud')
    .optional()
    .isString()
    .withMessage('El campo estado_salud debe ser de tipo String')
    .trim()
    .isLength({ max: 50 })
    .withMessage('El campo estado_salud no puede superar 50 caracteres'),
  body('galeria')
    .optional()
    .isObject()
    .withMessage('El campo galeria debe ser un objeto'),
  param('actualizacionId')
    .exists()
    .withMessage('Es necesario el campo actualizacionId')
    .isInt()
    .withMessage('El campo actualizacionId debe ser un número entero'),
  validate,
];

/* Validaciones para la activacion de cuentas de fundacion */
module.exports.validarTokenActivacion = [
  query('token')
    .exists()
    .withMessage('Es necesario el parametro token')
    .isString()
    .withMessage('El token debe ser de tipo String')
    .trim()
    .notEmpty()
    .withMessage('El token no puede estar vacio'),
  validate,
];

module.exports.activarCuenta = [
  body('token')
    .exists()
    .withMessage('Es necesario el campo token')
    .isString()
    .withMessage('El token debe ser de tipo String')
    .trim()
    .notEmpty()
    .withMessage('El token no puede estar vacio'),
  body('password')
    .exists()
    .withMessage('Es necesario el campo password')
    .isString()
    .withMessage('La contrasena debe ser de tipo String')
    .isLength({ min: 8 })
    .withMessage('La contrasena debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&._-])[A-Za-z\d@$!%*#?&._-]+$/)
    .withMessage('La contrasena debe incluir minusculas, mayusculas, un numero y un caracter especial'),
  validate,
];
