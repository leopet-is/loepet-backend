const {
  esCedulaValida,
  esRucValido,
  esTelefonoEcuador,
} = require('../../utils/validators');

describe('utils/validators', () => {
  describe('esCedulaValida', () => {
    it('acepta una cedula valida de Pichincha', () => {
      expect(esCedulaValida('1710034065')).toBe(true);
    });

    it('rechaza una cedula con digito verificador incorrecto', () => {
      expect(esCedulaValida('1710034066')).toBe(false);
    });

    it('rechaza cedulas cuyo tercer digito es 6 (destinado a RUC publico)', () => {
      expect(esCedulaValida('1760034065')).toBe(false);
    });

    it('acepta cedulas emitidas en el exterior (provincia 30)', () => {
      expect(esCedulaValida('3012345678')).toBe(true);
      expect(esCedulaValida('3012345679')).toBe(false);
    });

    it('rechaza provincia inexistente (mayor a 24 y distinta de 30)', () => {
      expect(esCedulaValida('2562854918')).toBe(false);
    });

    it('rechaza longitudes distintas de 10 digitos', () => {
      expect(esCedulaValida('171003406')).toBe(false);
      expect(esCedulaValida('')).toBe(false);
      expect(esCedulaValida(1710034065)).toBe(false);
    });
  });

  describe('esRucValido', () => {
    it('acepta RUC de persona natural (cedula valida + establecimiento)', () => {
      expect(esRucValido('1710034065001')).toBe(true);
    });

    it('rechaza RUC natural con establecimiento 000', () => {
      expect(esRucValido('1710034065000')).toBe(false);
    });

    it('rechaza RUC natural cuya cedula base es invalida', () => {
      expect(esRucValido('1710034066001')).toBe(false);
    });

    it('acepta RUC de persona juridica privada con verificador mod 11', () => {
      expect(esRucValido('1790016919001')).toBe(true);
    });

    it('rechaza RUC juridica con digito verificador incorrecto', () => {
      expect(esRucValido('1790016918001')).toBe(false);
    });

    it('acepta RUC de institucion publica (establecimiento de 4 digitos)', () => {
      expect(esRucValido('1760001550001')).toBe(true);
    });

    it('rechaza RUC publico con digito verificador incorrecto', () => {
      expect(esRucValido('1760008550001')).toBe(false);
    });

    it('rechaza RUC con tercer digito no asignado (7 u 8)', () => {
      expect(esRucValido('1770034065001')).toBe(false);
    });

    it('rechaza RUC con longitud distinta de 13 digitos', () => {
      expect(esRucValido('176000805001')).toBe(false);
      expect(esRucValido('')).toBe(false);
      expect(esRucValido(1710034065001)).toBe(false);
    });
  });

  describe('esTelefonoEcuador', () => {
    it('acepta un movil ecuatoriano (09XXXXXXXX)', () => {
      expect(esTelefonoEcuador('0987654321')).toBe(true);
    });

    it('acepta un telefono fijo (0[2-7]XXXXXXX)', () => {
      expect(esTelefonoEcuador('022223344')).toBe(true);
    });

    it('rechaza formatos no validos', () => {
      expect(esTelefonoEcuador('12345678')).toBe(false);
      expect(esTelefonoEcuador('098765432')).toBe(false);
      expect(esTelefonoEcuador('0000000000')).toBe(false);
    });
  });
});