import { validarCedulaEcuatoriana } from './ecuadorianIdValidator';
import { procesarTextoOCR } from './ocrParser';

// Función helper de aserción simple
function assert(condicion: boolean, mensaje: string) {
  if (!condicion) {
    console.error(`❌ FALLÓ: ${mensaje}`);
    process.exit(1);
  } else {
    console.log(`✅ PASÓ: ${mensaje}`);
  }
}

console.log('--- RUNNING OCR & ECUADORIAN ID VALIDATOR TESTS ---');

// 1. Test de Validación de Cédulas Válidas
const cedulaValida1 = validarCedulaEcuatoriana('1710034065');
assert(cedulaValida1.esValido === true, '1710034065 debe ser una cédula válida (Pichincha)');

const cedulaValida2 = validarCedulaEcuatoriana('0926629999');
assert(cedulaValida2.esValido === true, '0926629999 debe ser una cédula válida (Guayas)');

// 2. Test de Validación de Cédulas Inválidas
const cedulaInvalidaChecksum = validarCedulaEcuatoriana('1710034069');
assert(cedulaInvalidaChecksum.esValido === false, '1710034069 debe fallar por dígito verificador');

const provinciaInvalida = validarCedulaEcuatoriana('5510034065');
assert(provinciaInvalida.esValido === false, '5510034065 debe fallar por provincia inexistente');

const tercerDigitoInvalido = validarCedulaEcuatoriana('1790034065');
assert(tercerDigitoInvalido.esValido === false, '1790034065 debe fallar porque 3er dígito no es persona natural');

// 3. Test de Parser OCR con Texto Sucio y Sustituciones de Cámara
const ocrTextFront = `
  REPUBLICA DEL ECUADOR
  CEDULA DE CIUDADANIA
  NUI: 1710034065
  APELLIDOS: PEREZ ROCA
  NOMBRES: JUAN CARLOS
  FECHA DE NACIMIENTO: 15/04/1990
  NACIONALIDAD: ECUATORIANA
  SEXO: MASCULINO
`;

const resFront = procesarTextoOCR(ocrTextFront);
assert(resFront.numeroDocumento === '1710034065', 'Debe extraer el número de cédula 1710034065');
assert(resFront.esCedulaValida === true, 'La cédula extraída debe ser matemáticamente válida');
assert(resFront.primerApellido === 'PEREZ', 'Debe extraer 1er Apellido: PEREZ');
assert(resFront.segundoApellido === 'ROCA', 'Debe extraer 2do Apellido: ROCA');
assert(resFront.nombres === 'JUAN CARLOS', 'Debe extraer Nombres: JUAN CARLOS');
assert(resFront.fechaNacimiento === '15/04/1990', 'Debe extraer Fecha de Nacimiento: 15/04/1990');
assert(resFront.nacionalidad === 'ECUATORIANA', 'Debe extraer Nacionalidad: ECUATORIANA');
assert(resFront.sexo === 'MASCULINO', 'Debe extraer Sexo: MASCULINO');

const ocrTextBack = `
  REPUBLICA DEL ECUADOR
  REGISTRO CIVIL
  COD. DACTILAR: V1234I5678
  FECHA EXP: 12/05/2024
`;

const resBack = procesarTextoOCR(ocrTextBack);
assert(resBack.codigoDactilar === 'V1234I5678', 'Debe extraer el código dactilar V1234I5678 del reverso');

// 4. Test con Ruido de OCR (O por 0, I por 1, espacios y guiones)
const ocrRuido = `
  REPUBLICA DEL ECUADOR
  NUI: 171O034O65
`;
const resRuido = procesarTextoOCR(ocrRuido);
assert(resRuido.numeroDocumento === '1710034065', 'Debe corregir O por 0 y validar la cédula 1710034065');

// 5. Test con cédula con espacios y separadores de fecha no estándar (|)
const ocrTextRuidoCamara = `
  REPUBLICA DEL ECUADOR
  CEDULA DE CIUDADANIA
  NUI: 17100 34065
  APELLIDOS Y NOMBRES: PEREZ ROCA JUAN CARLOS
  FECHA DE NACIMIENTO: 15|04|1990
  SEXO: M
`;
const resRuidoCamara = procesarTextoOCR(ocrTextRuidoCamara);
assert(resRuidoCamara.numeroDocumento === '1710034065', 'Debe detectar número de cédula incluso con espacio intermedio 17100 34065');
assert(resRuidoCamara.primerApellido === 'PEREZ', 'Debe extraer 1er Apellido en línea combinada: PEREZ');
assert(resRuidoCamara.segundoApellido === 'ROCA', 'Debe extraer 2do Apellido en línea combinada: ROCA');
assert(resRuidoCamara.nombres === 'JUAN CARLOS', 'Debe extraer Nombres en línea combinada: JUAN CARLOS');
assert(resRuidoCamara.fechaNacimiento === '15/04/1990', 'Debe corregir separadores de fecha | a /: 15/04/1990');
assert(resRuidoCamara.sexo === 'MASCULINO', 'Debe interpretar sexo M como MASCULINO');

// 6. TEST FORMATO 1: Cédula Biométrica Digital (Registro Civil 2023)
const ocrFormato1 = `
  REPUBLICA DEL ECUADOR
  DIRECCION GENERAL DE REGISTRO CIVIL, IDENTIFICACION Y CEDULACION
  APELLIDOS CONDICION CIUDADANIA
  BELTRAN
  IZA
  NOMBRES
  ANTHONY FABRICIO
  NACIONALIDAD ECUATORIANA
  FECHA DE NACIMIENTO 01 JUN 1996
  NUI.1723454961
  SEXO HOMBRE
  CÓDIGO DACTILAR V4444V4444
`;
const resF1 = procesarTextoOCR(ocrFormato1);
assert(resF1.numeroDocumento === '1723454961', 'F1: Debe extraer NUI.1723454961');
assert(resF1.esCedulaValida === true, 'F1: Cédula 1723454961 debe ser matemáticamente válida');
assert(resF1.primerApellido === 'BELTRAN', 'F1: 1er Apellido BELTRAN');
assert(resF1.segundoApellido === 'IZA', 'F1: 2do Apellido IZA');
assert(resF1.nombres === 'ANTHONY FABRICIO', 'F1: Nombres ANTHONY FABRICIO');
assert(resF1.fechaNacimiento === '01/06/1996', 'F1: Fecha 01 JUN 1996 a 01/06/1996');
assert(resF1.sexo === 'MASCULINO', 'F1: Sexo HOMBRE a MASCULINO');
assert(resF1.codigoDactilar === 'V4444V4444', 'F1: Dactilar V4444V4444');

// 7. TEST FORMATO 2: Cédula de Niño, Niña o Adolescente
const ocrFormato2 = `
  REPUBLICA DEL ECUADOR
  CEDULA DE CIUDADANO NINO, NINA O ADOLESCENTE
  No. 1756057459
  APELLIDOS Y NOMBRES
  ARIAS CARTAGENA
  CIELO KIMBERLY
  FECHA DE NACIMIENTO 2002-02-05
  NACIONALIDAD ECUATORIANA
  SEXO MUJER
  E3343I2222
`;
const resF2 = procesarTextoOCR(ocrFormato2);
assert(resF2.numeroDocumento === '1756057459', 'F2: Debe extraer No. 1756057459');
assert(resF2.esCedulaValida === true, 'F2: Cédula 1756057459 debe ser matemáticamente válida');
assert(resF2.primerApellido === 'ARIAS', 'F2: 1er Apellido ARIAS');
assert(resF2.segundoApellido === 'CARTAGENA', 'F2: 2do Apellido CARTAGENA');
assert(resF2.nombres === 'CIELO KIMBERLY', 'F2: Nombres CIELO KIMBERLY');
assert(resF2.fechaNacimiento === '05/02/2002', 'F2: Fecha 2002-02-05 a 05/02/2002');
assert(resF2.sexo === 'FEMENINO', 'F2: Sexo MUJER a FEMENINO');
assert(resF2.codigoDactilar === 'E3343I2222', 'F2: Dactilar E3343I2222 sin etiqueta');

// 8. TEST FORMATO 3: Cédula Plástica Anterior con Chip (No. 092168471-8)
const ocrFormato3 = `
  REPUBLICA DEL ECUADOR
  CEDULA DE CIUDADANIA No. 092168471-8
  APELLIDOS Y NOMBRES
  AVILA MANRIQUE
  BETSY MARIETTA
  FECHA DE NACIMIENTO 1982-09-01
  NACIONALIDAD ECUATORIANA
  SEXO F
  V4333V2242
  IDECU0921684718<<<<<<<<<<<<<<<
  8209011F190927ECU<<<<<<<<<<<<<
  AVILA<MANRIQUE<<BETSY<MARIETTA
`;
const resF3 = procesarTextoOCR(ocrFormato3);
assert(resF3.numeroDocumento === '0921684718', 'F3: Debe extraer 0921684718 sin guión');
assert(resF3.esCedulaValida === true, 'F3: Cédula 0921684718 debe ser matemáticamente válida');
assert(resF3.primerApellido === 'AVILA', 'F3: 1er Apellido AVILA');
assert(resF3.segundoApellido === 'MANRIQUE', 'F3: 2do Apellido MANRIQUE');
assert(resF3.nombres === 'BETSY MARIETTA', 'F3: Nombres BETSY MARIETTA');
assert(resF3.fechaNacimiento === '01/09/1982', 'F3: Fecha 1982-09-01 a 01/09/1982');
assert(resF3.sexo === 'FEMENINO', 'F3: Sexo F a FEMENINO');
assert(resF3.codigoDactilar === 'V4333V2242', 'F3: Dactilar V4333V2242 sin etiqueta');

// 9. TEST: Distinguir Fecha de Nacimiento vs Fecha de Expedición y Expiración
const ocrConExpedicionYNacimiento = `
  REPUBLICA DEL ECUADOR
  CEDULA DE CIUDADANIA
  NUI: 1710034065
  APELLIDOS Y NOMBRES: PEREZ ROCA JUAN CARLOS
  LUGAR Y FECHA DE EXPEDICION: QUITO 2024-05-10
  FECHA DE EXPIRACION: 2034-05-10
  FECHA DE NACIMIENTO: 1990-04-15
  SEXO: MASCULINO
`;
const resFechas = procesarTextoOCR(ocrConExpedicionYNacimiento);
assert(resFechas.fechaNacimiento === '15/04/1990', 'Debe extraer la Fecha de Nacimiento (15/04/1990) e ignorar la de expedición (2024-05-10)');

// 10. TEST: Reverso con datos de Cónyuge/Conviviente y MRZ (Caso real del usuario)
const ocrReversoConConyuge = `
  APELLIDOS Y NOMBRES DEL PADRE
  ANDRADE CEDEÑO BOLIVAR ANTONIO
  APELLIDOS Y NOMBRES DE LA MADRE
  CORNEJO CABAL BEATRIZ ALEXANDRA
  ESTADO CIVIL
  CASADO
  APELLIDOS Y NOMBRES DEL CÓNYUGE O CONVIVIENTE
  ACEBO ZAMBRANO DEYANIRA ALEJANDRA
  LUGAR Y FECHA DE EMISIÓN
  MANTA 28 JUN 2023
  DIRECTOR GENERAL
  CODIGO DACTILAR V4343V4444 TIPO SANGRE O+ DONANTE Si
  I<ECU0584110913<<<<<<<<<<<<<<<1350827596
  9609026M3306286ECU<SI<<<<<<<<<4
  ANDRADE<CORNEJO<<JERRY<YUNIOR<
`;
const resReverso = procesarTextoOCR(ocrReversoConConyuge);
assert(resReverso.numeroDocumento === '1350827596', 'Reverso con Cónyuge: Debe extraer cédula 1350827596');
assert(resReverso.codigoDactilar === 'V4343V4444', 'Reverso con Cónyuge: Debe extraer código dactilar V4343V4444');
assert(resReverso.primerApellido === 'ANDRADE', 'Reverso con Cónyuge: 1er Apellido debe ser ANDRADE');
assert(resReverso.segundoApellido === 'CORNEJO', 'Reverso con Cónyuge: 2do Apellido debe ser CORNEJO');
assert(resReverso.nombres === 'JERRY YUNIOR', 'Reverso con Cónyuge: Nombres deben ser JERRY YUNIOR (ignora CÓNYUGE O CONVIVIENTE)');

// 11. TEST: Reverso sin MRZ excluye datos de Cónyuge o Conviviente
const ocrReversoSinMRZ = `
  APELLIDOS Y NOMBRES DEL PADRE
  ANDRADE CEDEÑO BOLIVAR ANTONIO
  APELLIDOS Y NOMBRES DE LA MADRE
  CORNEJO CABAL BEATRIZ ALEXANDRA
  ESTADO CIVIL
  CASADO
  APELLIDOS Y NOMBRES DEL CÓNYUGE O CONVIVIENTE
  ACEBO ZAMBRANO DEYANIRA ALEJANDRA
  LUGAR Y FECHA DE EMISIÓN
  MANTA 28 JUN 2023
  CODIGO DACTILAR V4343V4444
`;
const resReversoSinMRZ = procesarTextoOCR(ocrReversoSinMRZ);
assert(resReversoSinMRZ.primerApellido !== 'CONYUGE' && resReversoSinMRZ.primerApellido !== 'CÓNYUGE', 'Reverso sin MRZ: 1er Apellido NO debe ser CÓNYUGE');
assert(resReversoSinMRZ.nombres !== 'CONVIVIENTE', 'Reverso sin MRZ: Nombres NO deben ser CONVIVIENTE');

console.log('--- ALL TESTS COMPLETED SUCCESSFULLY! ---');




