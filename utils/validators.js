/**
 * Validadores de documentos y telefonos de Ecuador (SRI / Registro Civil).
 * Reglas:
 * - Cedula: 10 digitos, provincia 01-24 (o 30 para ecuatorianos nacidos en el
 *   exterior), verificador modulo 10 (pesos [2,1,2,1,2,1,2,1,2]).
 * - RUC persona natural (3er digito 0-5): los primeros 10 digitos son una cedula
 *   valida + 3 digitos de establecimiento (el principal es 001).
 * - RUC juridica privada (3er digito 9): verificador modulo 11 (pesos
 *   [4,3,2,7,6,5,4,3,2]) sobre los primeros 9 digitos (posicion 10).
 * - RUC publica (3er digito 6): verificador modulo 11 (pesos [3,2,7,6,5,4,3,2])
 *   sobre los primeros 8 digitos (posicion 9) + 4 digitos de establecimiento.
 */

const esProvincia = (digits) => {
  const codigo = parseInt(digits.slice(0, 2), 10);
  return codigo >= 1 && codigo <= 24;
};

const modulo10 = (digits) => {
  const pesos = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const suma = digits.reduce((acc, digit, index) => {
    const producto = digit * pesos[index];
    return acc + (producto > 9 ? producto - 9 : producto);
  }, 0);
  return (10 - (suma % 10)) % 10;
};

const modulo11 = (digits, pesos) => {
  const suma = digits.reduce((acc, digit, index) => acc + (digit * pesos[index]), 0);
  const residuo = suma % 11;
  const digitoVerificador = 11 - residuo;
  if (digitoVerificador === 11) return 0;
  if (digitoVerificador === 10) return -1;
  return digitoVerificador;
};

/**
 * Valida una cedula ecuatoriana (10 digitos con digito verificador).
 * @param {String} cedula
 * @return {Boolean}
 */
exports.esCedulaValida = (cedula = '') => {
  if (typeof cedula !== 'string' || !/^\d{10}$/.test(cedula)) return false;
  const digits = cedula.split('').map(Number);
  const codigo = parseInt(cedula.slice(0, 2), 10);
  if (!(codigo >= 1 && codigo <= 24) && codigo !== 30) return false;
  if (digits[2] === 6) return false;
  return modulo10(digits.slice(0, 9)) === digits[9];
};

/**
 * Valida un RUC ecuatoriano (13 digitos con digito verificador).
 * @param {String} ruc
 * @return {Boolean}
 */
exports.esRucValido = (ruc = '') => {
  if (typeof ruc !== 'string' || !/^\d{13}$/.test(ruc)) return false;
  const digits = ruc.split('').map(Number);
  const tercerDigito = digits[2];

  if (tercerDigito <= 5) {
    if (!exports.esCedulaValida(ruc.slice(0, 10))) return false;
    if (parseInt(ruc.slice(10, 13), 10) < 1) return false;
  } else if (tercerDigito === 9) {
    if (!esProvincia(ruc)) return false;
    const verificador = modulo11(digits.slice(0, 9), [4, 3, 2, 7, 6, 5, 4, 3, 2]);
    if (verificador !== digits[9]) return false;
    if (parseInt(ruc.slice(10, 13), 10) < 1) return false;
  } else if (tercerDigito === 6) {
    if (!esProvincia(ruc)) return false;
    const verificador = modulo11(digits.slice(0, 8), [3, 2, 7, 6, 5, 4, 3, 2]);
    if (verificador !== digits[8]) return false;
    if (parseInt(ruc.slice(-4), 10) < 1) return false;
  } else {
    return false;
  }

  return true;
};

/**
 * Valida formatos de telefono de Ecuador: movil (09XXXXXXXX) o fijo (0[2-7]XXXXXXX).
 * @param {String} telefono
 * @return {Boolean}
 */
exports.esTelefonoEcuador = (telefono = '') => {
  if (typeof telefono !== 'string') return false;
  return /^09\d{8}$/.test(telefono) || /^0[2-7]\d{7}$/.test(telefono);
};
