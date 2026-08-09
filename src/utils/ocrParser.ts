import { DatosCedula } from '../types/cedula';
import { validarCedulaEcuatoriana } from './ecuadorianIdValidator';

/**
 * Normaliza una cadena quitando tildes, diéresis y convirtiendo a mayúsculas
 */
function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

/**
 * Corrige errores comunes de OCR en cadenas numéricas (ej. O -> 0, I/l/| -> 1, S -> 5, etc.)
 */
function corregirNumerosOCR(texto: string): string {
  return texto
    .replace(/[O|o|Q|D]/g, '0')
    .replace(/[I|l|1|\||\!]/g, '1')
    .replace(/[Z|z]/g, '2')
    .replace(/[E|e]/g, '3')
    .replace(/[A|a]/g, '4')
    .replace(/[S|s]/g, '5')
    .replace(/[G|g|b]/g, '6')
    .replace(/[T|t]/g, '7')
    .replace(/[B]/g, '8')
    .replace(/[q]/g, '9');
}

/**
 * Palabras estáticas reservadas presentes en los 3 formatos de cédula ecuatoriana
 * que no deben considerarse como apellidos o nombres del titular.
 */
const PALABRAS_RESERVADAS = new Set([
  'REPUBLICA', 'DEL', 'ECUADOR', 'CEDULA', 'CIUDADANIA', 'IDENTIDAD', 'CIUDADANO',
  'NINO', 'NINA', 'ADOLESCENTE', 'REGISTRO', 'CIVIL', 'IDENTIFICACION', 'CEDULACION',
  'DIRECCION', 'GENERAL', 'INSTITUTO', 'FIRMA', 'TITULAR', 'CEDULADO', 'FECHA', 'NACIMIENTO',
  'EXPEDICION', 'EXPIRACION', 'VENCIMIENTO', 'VALIDEZ', 'LUGAR', 'PROVINCIA', 'CANTON',
  'PARROQUIA', 'ESTADO', 'CIVIL', 'PROFESION', 'OCUPACION', 'INSTRUCCION', 'CONDICION',
  'DONANTE', 'SEXO', 'NACIONALIDAD', 'NUI', 'NO', 'NUMERO', 'DOCUMENTO', 'CODIGO',
  'DACTILAR', 'COD', 'APELLIDO', 'APELLIDOS', 'NOMBRE', 'NOMBRES', 'PADRE', 'MADRE',
  'MASCULINO', 'FEMENINO', 'HOMBRE', 'MUJER', 'ECUATORIANA', 'ECUATORIANO', 'ECU',
  'SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'UNION', 'HECHO', 'DIRECTOR', 'GOBIERNO',
  'SECCIONAL', 'BASICA', 'ESTUDIANTE', 'SUPERIOR', 'AUTONOMO', 'CORP', 'REG',
  'CONYUGE', 'CONVIVIENTE', 'ESPOSO', 'ESPOSA', 'CIUDADANA', 'CIUDADANLA', 'CIUDADAMIA',
  'CIUDADAN1A', 'CIUDADANLA', 'CONDIC1ON', 'EMISION', 'TIPO', 'SANGRE', 'FACTOR', 'RH'
]);

/**
 * Filtra palabras ruidosas o etiquetas estáticas para aislar nombres y apellidos.
 */
function limpiarNombre(texto: string): string {
  return texto
    .replace(/[^A-Z\sÑÁÉÍÓÚ]/gi, ' ')
    .split(/\s+/)
    .filter((w) => {
      const wNorm = normalizarTexto(w);
      return wNorm.length >= 2 && !PALABRAS_RESERVADAS.has(wNorm);
    })
    .join(' ')
    .trim();
}

/**
 * Determina si una línea pertenece a familiares (Padre, Madre, Cónyuge/Conviviente)
 * o metadatos del reverso que no deben ser interpretados como nombres del titular.
 */
function esLineaFamiliarOInvalida(linea: string): boolean {
  const norm = normalizarTexto(linea);
  return (
    norm.includes('PADRE') ||
    norm.includes('MADRE') ||
    norm.includes('CONYUGE') ||
    norm.includes('CONVIVIENTE') ||
    norm.includes('ESPOSO') ||
    norm.includes('ESPOSA') ||
    norm.includes('EMISION') ||
    norm.includes('DIRECTOR')
  );
}

/**
 * Convierte nombres de mes en español a su número de 2 dígitos.
 */
const MESES_MAP: Record<string, string> = {
  ENE: '01', FEB: '02', MAR: '03', ABR: '04', MAY: '05', JUN: '06',
  JUL: '07', AGO: '08', SEP: '09', OCT: '10', NOV: '11', DIC: '12'
};

/**
 * Procesa el texto plano retornado por el motor de OCR y extrae los 8 campos
 * de los 3 formatos de cédula ecuatoriana vigentes.
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
  // 1. NÚMERO DE CÉDULA (DOCUMENTO NUI)
  // -------------------------------------------------------------
  let numeroCedulaEncontrado: string | null = null;
  let esValido = false;

  // A. Coincidencia directa con etiqueta NUI. (ej. NUI.1350827596 o NUI: 1710034065)
  const matchNuiEtiqueta = textoUpper.match(/\bNUI\.?\s*[:.-]?\s*([0-9OIQILSZBGT\s.-]{9,15})/i);
  if (matchNuiEtiqueta && matchNuiEtiqueta[1]) {
    const candidatoLimpio = corregirNumerosOCR(matchNuiEtiqueta[1].replace(/[^\w]/g, ''));
    if (candidatoLimpio.length >= 10) {
      const sub10 = candidatoLimpio.substring(0, 10);
      const res = validarCedulaEcuatoriana(sub10);
      if (res.esValido) {
        numeroCedulaEncontrado = sub10;
        esValido = true;
      }
    }
  }

  // B. Coincidencia directa con guión o sufijo (ej. 092168471-8 -> 0921684718)
  if (!numeroCedulaEncontrado) {
    const matchesConGuion = textoUpper.match(/\b\d{9}[-.]?\d\b/g) || [];
    for (const match of matchesConGuion) {
      const candidatoLimpio = match.replace(/[^\d]/g, '');
      if (candidatoLimpio.length === 10) {
        const res = validarCedulaEcuatoriana(candidatoLimpio);
        if (res.esValido) {
          numeroCedulaEncontrado = candidatoLimpio;
          esValido = true;
          break;
        }
      }
    }
  }

  // C. Escanear tras prefijos genéricos No., Nº, CEDULA, DOCUMENTO
  if (!numeroCedulaEncontrado) {
    const matchEtiquetaGenerica = textoUpper.match(/(?:NO\.?|Nº|CEDULA|DOCUMENTO)\s*[:.-]?\s*([0-9OIQILSZBGT\s.-]{9,15})/i);
    if (matchEtiquetaGenerica && matchEtiquetaGenerica[1]) {
      const candidatoLimpio = corregirNumerosOCR(matchEtiquetaGenerica[1].replace(/[^\w]/g, ''));
      if (candidatoLimpio.length >= 10) {
        const sub10 = candidatoLimpio.substring(0, 10);
        const res = validarCedulaEcuatoriana(sub10);
        if (res.esValido) {
          numeroCedulaEncontrado = sub10;
          esValido = true;
        }
      }
    }
  }

  // D. Escanear en líneas MRZ (ej. I<ECU0491012184<<<<<1723454961 o IDECU0921684718<<<<<)
  if (!numeroCedulaEncontrado) {
    const mrzDigitsMatches = textoUpper.match(/(?:ECU|IDECU)([0-9OIQILSZBGT]{10})/g) || [];
    for (const mrzMatch of mrzDigitsMatches) {
      const digitos = mrzMatch.replace(/^(?:ECU|IDECU)/, '');
      const candidatoCorregido = corregirNumerosOCR(digitos);
      const res = validarCedulaEcuatoriana(candidatoCorregido);
      if (res.esValido) {
        numeroCedulaEncontrado = candidatoCorregido;
        esValido = true;
        break;
      }
    }
  }

  // E. Barrido de ventana deslizante sobre texto completo corrigiendo caracteres ambiguos
  if (!numeroCedulaEncontrado) {
    const textoLimpiado = textoUpper.replace(/[^A-Z0-9]/g, '');
    const textoCorregido = corregirNumerosOCR(textoLimpiado);
    const soloDigitos = textoCorregido.replace(/[^\d]/g, '');

    for (let i = 0; i <= soloDigitos.length - 10; i++) {
      const subCadena = soloDigitos.substring(i, i + 10);
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
  // Formatos en reverso: V4444V4444, E3343I2222, V4333V2242 (10 caracteres exactos)
  // -------------------------------------------------------------
  let codigoDactilarEncontrado: string | null = null;
  const regexDactilarEstandar = /\b[A-Z]\d{4}[A-Z]\d{4}\b/g;
  const matchesDactilar = textoUpper.match(regexDactilarEstandar) || [];

  if (matchesDactilar.length > 0) {
    codigoDactilarEncontrado = matchesDactilar[0];
  } else {
    const regexEtiqueta = /(?:DACTILAR|CODIGO|CÓDIGO|COD)\s*[:.-]?\s*([A-Z0-9\s]{8,12})/i;
    const matchEtiqueta = textoUpper.match(regexEtiqueta);
    if (matchEtiqueta && matchEtiqueta[1]) {
      const posibleDactilar = matchEtiqueta[1].replace(/\s+/g, '');
      if (posibleDactilar.length === 10 && /\d{4}/.test(posibleDactilar)) {
        let dactilarFormateado = posibleDactilar;
        if (/\d/.test(dactilarFormateado[0])) {
          dactilarFormateado = 'V' + dactilarFormateado.substring(1);
        }
        if (/\d/.test(dactilarFormateado[5])) {
          dactilarFormateado = dactilarFormateado.substring(0, 5) + 'I' + dactilarFormateado.substring(6);
        }
        codigoDactilarEncontrado = dactilarFormateado;
      }
    }
  }

  // -------------------------------------------------------------
  // 3. APELLIDOS Y NOMBRES (1er Apellido, 2do Apellido, Nombres)
  // -------------------------------------------------------------
  let primerApellido: string | null = null;
  let segundoApellido: string | null = null;
  let nombres: string | null = null;

  // Estrategia A: MRZ Zone (Línea 3 de cédulas biométricas y plásticas)
  // Ejemplos: BELTRAN<IZA<<ANTHONY<FABRICIO< o AVILA<MANRIQUE<<BETSY<MARIETTA o ANDRADE<CORNEJO<<JERRY<YUNIOR<
  const matchMrzNombres = textoUpper.match(/([A-Z]+(?:<[A-Z]+)*)<<([A-Z]+(?:<[A-Z]+)*)/);
  if (matchMrzNombres) {
    const apellidosStr = matchMrzNombres[1].replace(/</g, ' ').trim();
    const nombresStr = matchMrzNombres[2].replace(/</g, ' ').trim();
    const apellidosParte = apellidosStr.split(/\s+/).filter(Boolean);
    if (apellidosParte.length >= 1 && nombresStr.length >= 2) {
      primerApellido = apellidosParte[0];
      if (apellidosParte.length >= 2) segundoApellido = apellidosParte[1];
      nombres = nombresStr;
    }
  }

  // Estrategia B: Lectura de etiquetas "APELLIDOS Y NOMBRES" excluyendo datos de Padre, Madre, Cónyuge o Conviviente
  if (!primerApellido || !nombres) {
    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i];

      // Ignorar líneas pertenecientes a PADRE, MADRE, CÓNYUGE, CONVIVIENTE, EMISIÓN, DIRECTOR
      if (esLineaFamiliarOInvalida(linea)) {
        continue;
      }

      if (linea.includes('APELLIDOS Y NOMBRES') || (linea.includes('APELLIDOS') && linea.includes('NOMBRES'))) {
        const textoEnMismaLinea = limpiarNombre(linea.replace(/.*(?:APELLIDOS\s*Y\s*NOMBRES|NOMBRES\s*Y\s*APELLIDOS)\s*[:.-]?\s*/i, ''));
        
        if (textoEnMismaLinea) {
          const palabras = textoEnMismaLinea.split(/\s+/);
          if (palabras.length >= 3) {
            primerApellido = palabras[0];
            segundoApellido = palabras[1];
            nombres = palabras.slice(2).join(' ');
          } else if (palabras.length === 2) {
            primerApellido = palabras[0];
            nombres = palabras[1];
          }
        } else {
          // El texto de los apellidos está en la siguiente línea i+1, y nombres en i+2
          if (i + 1 < lineas.length && !esLineaFamiliarOInvalida(lineas[i + 1])) {
            const lineaApellidos = limpiarNombre(lineas[i + 1]);
            const palabrasAp = lineaApellidos.split(/\s+/).filter(Boolean);
            if (palabrasAp.length >= 1) primerApellido = palabrasAp[0];
            if (palabrasAp.length >= 2) segundoApellido = palabrasAp[1];
          }
          if (i + 2 < lineas.length && !esLineaFamiliarOInvalida(lineas[i + 2])) {
            const lineaNombres = limpiarNombre(lineas[i + 2]);
            if (lineaNombres && !lineaNombres.includes('LUGAR') && !lineaNombres.includes('NACIMIENTO')) {
              nombres = lineaNombres;
            }
          }
        }
        break;
      }

      // Lectura de Formato 1 ("APELLIDOS" y "NOMBRES" en etiquetas separadas)
      if (!primerApellido && (linea.includes('APELLIDOS') || linea === 'APELLIDOS')) {
        let textoAp = limpiarNombre(linea.replace(/.*APELLIDOS\s*[:.-]?\s*/i, ''));
        if (!textoAp && i + 1 < lineas.length && !esLineaFamiliarOInvalida(lineas[i + 1])) {
          textoAp = limpiarNombre(lineas[i + 1]);
          if (!segundoApellido && i + 2 < lineas.length && !lineas[i + 2].includes('NOMBRES') && !esLineaFamiliarOInvalida(lineas[i + 2])) {
            const linea2 = limpiarNombre(lineas[i + 2]);
            if (linea2) textoAp += ' ' + linea2;
          }
        }
        const listaAp = textoAp.split(/\s+/).filter(Boolean);
        if (listaAp.length >= 1) primerApellido = listaAp[0];
        if (listaAp.length >= 2) segundoApellido = listaAp[1];
      }

      if (!nombres && (linea.includes('NOMBRES') || linea === 'NOMBRES')) {
        let textoNom = limpiarNombre(linea.replace(/.*NOMBRES\s*[:.-]?\s*/i, ''));
        if (!textoNom && i + 1 < lineas.length && !esLineaFamiliarOInvalida(lineas[i + 1])) {
          textoNom = limpiarNombre(lineas[i + 1]);
        }
        if (textoNom) nombres = textoNom;
      }
    }
  }

  // -------------------------------------------------------------
  // 4. FECHA DE NACIMIENTO
  // Formatos en los 3 documentos:
  // - Formato 1: "01 JUN 1996" (DD MMM YYYY)
  // - Formato 2: "2002-02-05" (YYYY-MM-DD)
  // - Formato 3: "1982-09-01" (YYYY-MM-DD)
  // -------------------------------------------------------------
  let fechaNacimiento: string | null = null;
  const textoNormalizadoFechas = textoUpper.replace(/(\d{2,4})[\|I!l\.](\d{2})[\|I!l\.](\d{2,4})/g, '$1/$2/$3');

  const parsearFechaString = (str: string): string | null => {
    if (!str) return null;
    const strNorm = str.replace(/(\d{1,4})[\|I!l\.](\d{1,2})[\|I!l\.](\d{1,4})/g, '$1/$2/$3');

    // A. Formato DD/MM/YYYY
    const matchDDMM = strNorm.match(/\b(0[1-9]|[12][0-9]|3[01])[\/\.-](0[1-9]|1[012])[\/\.-](19|20)\d{2}\b/);
    if (matchDDMM) return matchDDMM[0].replace(/[\.-]/g, '/');

    // B. Formato YYYY-MM-DD o YYYY/MM/DD
    const matchISO = strNorm.match(/\b(19|20)\d{2}[\/\.-](0[1-9]|1[012])[\/\.-](0[1-9]|[12][0-9]|3[01])\b/);
    if (matchISO) {
      const partes = matchISO[0].split(/[\/\.-]/);
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    // C. Formato DD MMM YYYY (ej. 01 JUN 1996)
    const matchTexto = strNorm.match(/\b(0[1-9]|[12][0-9]|3[01])\s+(ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\s+(19|20)\d{2}\b/);
    if (matchTexto) {
      const partes = matchTexto[0].split(/\s+/);
      const mesNum = MESES_MAP[partes[1]] || '01';
      return `${partes[0]}/${mesNum}/${partes[2]}`;
    }
    return null;
  };

  // Estrategia A: Buscar explícitamente en la línea de NACIMIENTO (excluyendo EXPEDICION / EXPIRACION / VENCIMIENTO)
  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    if ((l.includes('NACIMIENTO') || l.includes('FECHA NAC')) && !l.includes('EXPEDICION') && !l.includes('EXPIRACION') && !l.includes('VENCIMIENTO') && !l.includes('EMISION')) {
      let f = parsearFechaString(l);
      if (!f && i + 1 < lineas.length) {
        f = parsearFechaString(lineas[i + 1]);
      }
      if (f) {
        fechaNacimiento = f;
        break;
      }
    }
  }

  // Estrategia B: Extraer de MRZ Zona Línea 2 (Primeros 6 dígitos son YYMMDD de nacimiento)
  if (!fechaNacimiento) {
    for (const l of lineas) {
      const mrzL = l.replace(/\s+/g, '');
      const matchMrz2 = mrzL.match(/^(\d{6})\d[MF]\d{6}/);
      if (matchMrz2 && matchMrz2[1]) {
        const yymmdd = matchMrz2[1];
        const yy = yymmdd.substring(0, 2);
        const mm = yymmdd.substring(2, 4);
        const dd = yymmdd.substring(4, 6);
        const anioFull = parseInt(yy, 10) > 30 ? `19${yy}` : `20${yy}`;
        fechaNacimiento = `${dd}/${mm}/${anioFull}`;
        break;
      }
    }
  }

  // Estrategia C: Buscar en texto filtrando explícitamente líneas de expedición/expiración
  if (!fechaNacimiento) {
    const lineasFiltradasSinExpedicion = lineas.filter(
      (l) => !l.includes('EXPEDICION') && !l.includes('EXPIRACION') && !l.includes('VENCIMIENTO') && !l.includes('EMISION') && !l.includes('EXPIR') && !l.includes('EXPED')
    );
    fechaNacimiento = parsearFechaString(lineasFiltradasSinExpedicion.join('\n'));
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
  // Formatos en los 3 documentos:
  // - Formato 1: "SEXO HOMBRE" -> MASCULINO
  // - Formato 2: "SEXO MUJER" -> FEMENINO
  // - Formato 3: "SEXO F" / "SEXO M" -> FEMENINO / MASCULINO
  // -------------------------------------------------------------
  let sexo: string | null = null;
  if (/\bSEXO\s*[:.-]?\s*(MASCULINO|FEMENINO|HOMBRE|MUJER|M|F|H)\b/.test(textoUpper)) {
    const matchSexo = textoUpper.match(/\bSEXO\s*[:.-]?\s*(MASCULINO|FEMENINO|HOMBRE|MUJER|M|F|H)\b/);
    if (matchSexo) {
      const val = matchSexo[1];
      if (val === 'MASCULINO' || val === 'HOMBRE' || val === 'M' || val === 'H') {
        sexo = 'MASCULINO';
      } else if (val === 'FEMENINO' || val === 'MUJER' || val === 'F') {
        sexo = 'FEMENINO';
      }
    }
  } else if (/\b(MASCULINO|FEMENINO|HOMBRE|MUJER)\b/.test(textoUpper)) {
    if (textoUpper.includes('MASCULINO') || textoUpper.includes('HOMBRE')) {
      sexo = 'MASCULINO';
    } else if (textoUpper.includes('FEMENINO') || textoUpper.includes('MUJER')) {
      sexo = 'FEMENINO';
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


