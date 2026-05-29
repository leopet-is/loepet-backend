const _ = require('lodash');
const { validationResult } = require('express-validator');

const reducer = (accumulator, currentValue) => {
  accumulator[currentValue.param] = accumulator[currentValue.param] || [];
  accumulator[currentValue.param].push(currentValue.msg);
  return accumulator;
};

module.exports.AsyncWrapper = (fn) => (req, res, next) => (
  Promise.resolve(fn(req, res, next)).catch((err) => {
    if (_.has(err, ['errors'])) {
      const { errors } = err;
      const formatedErrors = errors.reduce(reducer, {});
      return res.status(422).json(formatedErrors);
    }
    return next(err);
  })
);

module.exports.validateRequest = (req) => new Promise((resolve, reject) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // eslint-disable-next-line prefer-promise-reject-errors, no-promise-executor-return
    return reject({ errors: errors.array() });
  }
  // eslint-disable-next-line no-promise-executor-return
  return resolve();
});

/**
 * Analiza la respuesta de la API de Listas Negras (OFAC/Otras)
 * Basado en la estructura DataSet de .NET (Schema + DiffGram)
 *
 * @param {Object} apiResponse - El objeto JSON completo retornado por la API
 * @returns {Object} - { esPositivo: boolean, mensaje: string }
 */
module.exports.analizarResultadoOFAC = (apiResponse) => {
  try {
    // 1. Parseo Dinámico: Extraer el XML
    // Aseguramos que exista el campo 'datos'
    if (!apiResponse || !apiResponse.datos) {
      console.warn("La respuesta no contiene el campo 'datos'");
      return { esPositivo: false, mensaje: 'Estructura inválida' };
    }

    const xmlString = apiResponse.datos;

    // 2. Inspecciona el DiffGram
    // Buscamos dónde empieza el nodo <diffgr:diffgram
    const startTag = '<diffgr:diffgram';
    const endTag = '</diffgr:diffgram>';

    const startIndex = xmlString.indexOf(startTag);

    // Si no existe el nodo diffgram, asumimos que no hay datos de retorno (CLEAN)
    if (startIndex === -1) {
      return { esPositivo: false, mensaje: 'LIMPIO (Sin DiffGram)' };
    }

    // Encontramos el cierre de la etiqueta de apertura (puede tener atributos)
    // Buscamos el primer '>' después del inicio del tag
    const closeOfStartTagIndex = xmlString.indexOf('>', startIndex);

    // Verificamos si es un tag auto-cerrado (ej: <diffgr:diffgram ... />)
    // Si hay un '/' justo antes del '>', es auto-cerrado -> VACÍO -> LIMPIO
    if (xmlString[closeOfStartTagIndex - 1] === '/') {
      return { esPositivo: false, mensaje: 'LIMPIO (DiffGram auto-cerrado)' };
    }

    // Buscamos dónde empieza el tag de cierre </diffgr:diffgram>
    const endTagIndex = xmlString.indexOf(endTag);

    if (endTagIndex === -1) {
      // XML mal formado, pero por seguridad ante listas negras, mejor revisar manual
      // O asumir negativo si la estructura está rota.
      return { esPositivo: false, mensaje: 'ERROR (XML Mal formado)' };
    }

    // 3. La Regla de Oro: Extraer contenido
    // El contenido está entre el final del tag de apertura y el inicio del tag de cierre
    const contenido = xmlString.substring(closeOfStartTagIndex + 1, endTagIndex).trim();

    // Si la longitud del contenido es 0, está vacío -> LIMPIO
    if (contenido.length === 0) {
      return { esPositivo: false, mensaje: 'LIMPIO (DiffGram vacío)' };
    }

    // Si hay contenido (cualquier caracter), hay hijos -> POSITIVO
    return { esPositivo: true, mensaje: 'POSITIVO (Coincidencia encontrada)' };
  } catch (error) {
    console.error('Error analizando OFAC:', error);
    // En cumplimiento, ante un error de código, a veces es mejor flaggear para revisión manual
    return { esPositivo: false, mensaje: 'ERROR DE PROCESAMIENTO' };
  }
};
