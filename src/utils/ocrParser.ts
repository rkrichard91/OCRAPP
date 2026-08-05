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
 * Procesa el texto plano retornado por el motor de OCR y extrae los 8 campos
 * de la cédula ecuatoriana con normalización y validación matemática.
 *
 * @param textoCrudo Texto reconocido por el motor de OCR
 * @returns Objeto DatosCedula con los 8 parámetros parseados y su validez
 */
export function procesarTextoOCR(textoCrudo: string): DatosCedula {
  if (!textoCrudo || textoCrudo.trim().length === 0) {
    return {
      numeroDocumento: null,
      codigoDactilar: null,
      nombres: null,
      primerApellido: null,
      segundoApellido: null,
      fechaNacimiento: null,
      nacionalidad: null,
      sexo: null,
      esCedulaValida: false,
      confianzaDocumento: 0,
      rawText: '',
    };
  }

  const textoUpper = textoCrudo.toUpperCase();
  const lineas = textoUpper.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // -------------------------------------------------------------
  // 1. NÚMERO DE CÉDULA (DOCUMENTO)
  // -------------------------------------------------------------
  let numeroCedulaEncontrado: string | null = null;
  let esValido = false;

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

  if (!numeroCedulaEncontrado) {
    const bloques = textoUpper.replace(/[\n\r]/g, ' ').split(/\s+/);
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
  // 2. CÓDIGO DACTILAR
  // -------------------------------------------------------------
  let codigoDactilarEncontrado: string | null = null;
  const regexDactilarEstandar = /\b[A-Z]\d{4}[A-Z]\d{4}\b/;
  const matchDactilarDirecto = textoUpper.match(regexDactilarEstandar);

  if (matchDactilarDirecto) {
    codigoDactilarEncontrado = matchDactilarDirecto[0];
  } else {
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
  // 3. APELLIDOS Y NOMBRES (1er Apellido, 2do Apellido, Nombres)
  // -------------------------------------------------------------
  let primerApellido: string | null = null;
  let segundoApellido: string | null = null;
  let nombres: string | null = null;

  // Estrategia A: MRZ (Machine Readable Zone en reverso de cédula biométrica)
  // Ejemplo: PEREZ<GOMEZ<<JUAN<CARLOS<<<<<<<<<<
  const lineaMrzNombres = lineas.find((l) => l.includes('<<') && /^[A-Z<]+$/.test(l));
  if (lineaMrzNombres) {
    const partesMrz = lineaMrzNombres.split('<<');
    if (partesMrz.length >= 2) {
      const apellidosParte = partesMrz[0].replace(/</g, ' ').trim().split(/\s+/);
      if (apellidosParte.length >= 1) primerApellido = apellidosParte[0];
      if (apellidosParte.length >= 2) segundoApellido = apellidosParte[1];
      nombres = partesMrz[1].replace(/</g, ' ').trim();
    }
  }

  // Estrategia B: Etiquetas explícitas (APELLIDOS / NOMBRES)
  if (!primerApellido || !nombres) {
    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i];

      // APELLIDOS
      if (linea.includes('APELLIDO') || linea.includes('APELLIDOS')) {
        const textoApellidos = linea.replace(/.*APELLIDOS?\s*[:.-]?\s*/i, '').trim();
        const listaApellidos = (textoApellidos || (lineas[i + 1] || '')).split(/\s+/);
        if (listaApellidos.length >= 1 && listaApellidos[0].length > 1) {
          primerApellido = listaApellidos[0];
        }
        if (listaApellidos.length >= 2 && listaApellidos[1].length > 1) {
          segundoApellido = listaApellidos[1];
        }
      }

      // NOMBRES
      if (linea.includes('NOMBRE') || linea.includes('NOMBRES')) {
        const textoNombres = linea.replace(/.*NOMBRES?\s*[:.-]?\s*/i, '').trim();
        nombres = textoNombres || (lineas[i + 1] || '').trim();
      }
    }
  }

  // -------------------------------------------------------------
  // 4. FECHA DE NACIMIENTO
  // Formatos: DD/MM/AAAA, DD-MM-AAAA, DD MMM YYYY, YYYY/MM/DD
  // -------------------------------------------------------------
  let fechaNacimiento: string | null = null;
  const regexFechaNumerica = /\b(0[1-9]|[12][0-9]|3[01])[\/\.-](0[1-9]|1[012])[\/\.-](19|20)\d{2}\b/;
  const matchFecha = textoUpper.match(regexFechaNumerica);

  if (matchFecha) {
    fechaNacimiento = matchFecha[0];
  } else {
    // Buscar con meses en texto (ej. 15 ABR 1990)
    const regexFechaTexto = /\b(0[1-9]|[12][0-9]|3[01])\s+(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s+(19|20)\d{2}\b/;
    const matchFechaTexto = textoUpper.match(regexFechaTexto);
    if (matchFechaTexto) {
      fechaNacimiento = matchFechaTexto[0];
    }
  }

  // -------------------------------------------------------------
  // 5. NACIONALIDAD
  // -------------------------------------------------------------
  let nacionalidad: string | null = null;
  if (textoUpper.includes('ECUATORIANA') || textoUpper.includes('ECUATORIANO') || textoUpper.includes('ECU')) {
    nacionalidad = 'ECUATORIANA';
  } else {
    const matchNac = textoUpper.match(/(?:NACIONALIDAD|NAC)\s*[:.-]?\s*([A-Z]{4,15})/);
    if (matchNac && matchNac[1]) {
      nacionalidad = matchNac[1];
    }
  }

  // -------------------------------------------------------------
  // 6. SEXO / GÉNERO
  // -------------------------------------------------------------
  let sexo: string | null = null;
  if (/\bSEXO\s*[:.-]?\s*(MASCULINO|FEMENINO|M|F|H)\b/.test(textoUpper)) {
    const matchSexo = textoUpper.match(/\bSEXO\s*[:.-]?\s*(MASCULINO|FEMENINO|M|F|H)\b/);
    if (matchSexo) {
      const val = matchSexo[1];
      sexo = val === 'M' || val === 'H' || val === 'MASCULINO' ? 'MASCULINO' : 'FEMENINO';
    }
  } else if (/\b(MASCULINO|FEMENINO)\b/.test(textoUpper)) {
    sexo = textoUpper.includes('MASCULINO') ? 'MASCULINO' : 'FEMENINO';
  } else {
    // Buscar indicador de género en MRZ (ej. 9004155M3008254ECU)
    const matchMrzSexo = textoUpper.match(/\d{6}\d[MF]\d{7}/);
    if (matchMrzSexo) {
      sexo = matchMrzSexo[0].includes('M') ? 'MASCULINO' : 'FEMENINO';
    }
  }

  // -------------------------------------------------------------
  // 7. CÁLCULO DE CONFIANZA
  // -------------------------------------------------------------
  let confianza = 0;
  if (numeroCedulaEncontrado) confianza += 30;
  if (esValido) confianza += 20;
  if (codigoDactilarEncontrado) confianza += 10;
  if (nombres) confianza += 10;
  if (primerApellido) confianza += 10;
  if (fechaNacimiento) confianza += 10;
  if (nacionalidad) confianza += 5;
  if (sexo) confianza += 5;

  return {
    numeroDocumento: numeroCedulaEncontrado,
    codigoDactilar: codigoDactilarEncontrado,
    nombres,
    primerApellido,
    segundoApellido,
    fechaNacimiento,
    nacionalidad,
    sexo,
    esCedulaValida: esValido,
    confianzaDocumento: Math.min(100, confianza),
    rawText: textoCrudo,
  };
}
