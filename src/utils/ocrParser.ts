import { DatosCedula } from '../types/cedula';
import { validarCedulaEcuatoriana } from './ecuadorianIdValidator';

/**
 * Corrige errores comunes de OCR en cadenas numéricas (ej. O -> 0, I -> 1, S -> 5)
 */
function corregirNumerosOCR(texto: string): string {
  return texto
    .replace(/[O|o|Q]/g, '0')
    .replace(/[I|l|1]/g, '1')
    .replace(/[Z|z]/g, '2')
    .replace(/[S|s]/g, '5')
    .replace(/[B]/g, '8');
}

/**
 * Procesa el texto plano retornado por el motor de OCR y extrae los campos
 * de la cédula ecuatoriana con normalización y validación matemática.
 *
 * @param textoCrudo Texto reconocido por el motor de OCR
 * @returns Objeto DatosCedula con la información parseada y su validez
 */
export function procesarTextoOCR(textoCrudo: string): DatosCedula {
  if (!textoCrudo || textoCrudo.trim().length === 0) {
    return {
      numeroDocumento: null,
      codigoDactilar: null,
      esCedulaValida: false,
      confianzaDocumento: 0,
      rawText: '',
    };
  }

  const textoUpper = textoCrudo.toUpperCase();

  // -------------------------------------------------------------
  // 1. EXTRAER Y VALIDAR NÚMERO DE CÉDULA (DOCUMENTO)
  // -------------------------------------------------------------
  let numeroCedulaEncontrado: string | null = null;
  let esValido = false;

  // Buscar secuencias de 10 dígitos (pueden estar separadas por espacios o guiones)
  const lineas = textoUpper.split('\n');
  const bloques = textoUpper.replace(/[\n\r]/g, ' ').split(/\s+/);

  // Estrategia A: Buscar números limpios de 10 dígitos en el texto
  const regexCedulaDirecta = /\b\d{10}\b/g;
  const matchesDirectos = textoUpper.match(regexCedulaDirecta) || [];

  for (const candidato of matchesDirectos) {
    const res = validarCedulaEcuatoriana(candidato);
    if (res.esValido) {
      numeroCedulaEncontrado = candidato;
      esValido = true;
      break;
    }
  }

  // Estrategia B: Si no se encontró de forma directa, intentar corrigiendo errores de OCR por palabra/bloque
  if (!numeroCedulaEncontrado) {
    for (const bloque of bloques) {
      const bloqueLimpio = bloque.replace(/[^\w]/g, '');
      if (bloqueLimpio.length === 10) {
        const candidatoCorregido = corregirNumerosOCR(bloqueLimpio);
        if (/^\d{10}$/.test(candidatoCorregido)) {
          const res = validarCedulaEcuatoriana(candidatoCorregido);
          if (res.esValido) {
            numeroCedulaEncontrado = candidatoCorregido;
            esValido = true;
            break;
          }
        }
      }
    }
  }

  // Estrategia C: Buscar dígitos contiguos interrumpidos por espacios o guiones (ej. "17123 45678" o "171234567-8")
  if (!numeroCedulaEncontrado) {
    const textoSoloDigitos = textoUpper.replace(/[^\d]/g, '');
    for (let i = 0; i <= textoSoloDigitos.length - 10; i++) {
      const subCadena = textoSoloDigitos.substring(i, i + 10);
      const res = validarCedulaEcuatoriana(subCadena);
      if (res.esValido) {
        numeroCedulaEncontrado = subCadena;
        esValido = true;
        break;
      }
    }
  }

  // -------------------------------------------------------------
  // 2. EXTRAER CÓDIGO DACTILAR (REVERSO DE CÉDULA)
  // Formato habitual ecuatoriano: 1 Letra + 4 Números + 1 Letra + 4 Números (ej. V1234I5678)
  // O con etiqueta previa: "CÓDIGO DACTILAR: V1234I5678"
  // -------------------------------------------------------------
  let codigoDactilarEncontrado: string | null = null;

  // Pattern A: Formato estándar Letra + 4 Dígitos + Letra + 4 Dígitos
  const regexDactilarEstandar = /\b[A-Z]\d{4}[A-Z]\d{4}\b/;
  const matchDactilarDirecto = textoUpper.match(regexDactilarEstandar);

  if (matchDactilarDirecto) {
    codigoDactilarEncontrado = matchDactilarDirecto[0];
  } else {
    // Pattern B: Buscar tras la palabra clave "DACTILAR", "CODIGO" o "CÓDIGO"
    const regexEtiqueta = /(?:DACTILAR|CODIGO|CÓDIGO|COD)\s*[:.-]?\s*([A-Z0-9]{8,10})/i;
    const matchEtiqueta = textoUpper.match(regexEtiqueta);
    if (matchEtiqueta && matchEtiqueta[1]) {
      const posibleDactilar = matchEtiqueta[1];
      if (/^[A-Z0-9]{8,10}$/.test(posibleDactilar)) {
        codigoDactilarEncontrado = posibleDactilar;
      }
    }
  }

  // -------------------------------------------------------------
  // 3. CÁLCULO DE PUNTAJE DE CONFIANZA
  // -------------------------------------------------------------
  let confianza = 0;
  if (numeroCedulaEncontrado) confianza += 50;
  if (esValido) confianza += 30;
  if (codigoDactilarEncontrado) confianza += 20;

  return {
    numeroDocumento: numeroCedulaEncontrado,
    codigoDactilar: codigoDactilarEncontrado,
    esCedulaValida: esValido,
    confianzaDocumento: confianza,
    rawText: textoCrudo,
  };
}
