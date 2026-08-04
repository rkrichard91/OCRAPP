import { ValidacionCedulaResult } from '../types/cedula';

/**
 * Valida si un número de 10 dígitos es una cédula de identidad ecuatoriana válida
 * utilizando el algoritmo oficial de verificación de Módulo 10.
 *
 * @param cedula Cadena numérica de 10 dígitos
 * @returns ValidacionCedulaResult con el estado de validez y detalles
 */
export function validarCedulaEcuatoriana(cedula: string): ValidacionCedulaResult {
  // Limpiar espacios y guiones
  const idLimpio = cedula.replace(/[\s-]/g, '');

  // 1. Debe tener exactamente 10 dígitos numéricos
  if (!/^\d{10}$/.test(idLimpio)) {
    return {
      esValido: false,
      mensajeError: 'El documento debe contener exactamente 10 dígitos numéricos.',
    };
  }

  // 2. Verificar código de provincia (primeros 2 dígitos: 01-24 o 30)
  const provincia = parseInt(idLimpio.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return {
      esValido: false,
      provincia,
      mensajeError: `Código de provincia inválido: ${provincia.toString().padStart(2, '0')}.`,
    };
  }

  // 3. El tercer dígito debe ser menor a 6 para personas naturales (cédula)
  const tercerDigito = parseInt(idLimpio.substring(2, 3), 10);
  if (tercerDigito >= 6) {
    return {
      esValido: false,
      provincia,
      mensajeError: `El tercer dígito (${tercerDigito}) no corresponde a una cédula de persona natural.`,
    };
  }

  // 4. Algoritmo de Verificación Módulo 10 (Coeficientes: 2, 1, 2, 1, 2, 1, 2, 1, 2)
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const digitoVerificadorEsperado = parseInt(idLimpio.substring(9, 10), 10);

  let suma = 0;
  for (let i = 0; i < 9; i++) {
    const valor = parseInt(idLimpio.charAt(i), 10) * coeficientes[i];
    suma += valor >= 10 ? valor - 9 : valor;
  }

  const modulo = suma % 10;
  const digitoCalculado = modulo === 0 ? 0 : 10 - modulo;

  if (digitoCalculado !== digitoVerificadorEsperado) {
    return {
      esValido: false,
      provincia,
      mensajeError: `Dígito verificador incorrecto. Esperado: ${digitoCalculado}, recibido: ${digitoVerificadorEsperado}.`,
    };
  }

  return {
    esValido: true,
    provincia,
  };
}
