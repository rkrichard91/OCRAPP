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
`;

const resFront = procesarTextoOCR(ocrTextFront);
assert(resFront.numeroDocumento === '1710034065', 'Debe extraer el número de cédula 1710034065');
assert(resFront.esCedulaValida === true, 'La cédula extraída debe ser matemáticamente válida');

const ocrTextBack = `
  REPUBLICA DEL ECUADOR
  REGISTRO CIVIL
  COD. DACTILAR: V1234I5678
  FECHA EXP: 12/05/2024
`;

const resBack = procesarTextoOCR(ocrTextBack);
assert(resBack.codigoDactilar === 'V1234I5678', 'Debe extraer el código dactilar V1234I5678 del reverso');

// 4. Test con Ruido de OCR (O por 0, I por 1)
const ocrRuido = `
  REPUBLICA DEL ECUADOR
  NUI: 171O034O65
`;
const resRuido = procesarTextoOCR(ocrRuido);
assert(resRuido.numeroDocumento === '1710034065', 'Debe corregir O por 0 y validar la cédula 1710034065');

console.log('--- ALL TESTS COMPLETED SUCCESSFULLY! ---');
