import { BrowserPDF417Reader, BrowserMultiFormatReader } from '@zxing/library';
import { DatosCedula } from '../types/cedula';
import { procesarTextoOCR } from './ocrParser';

const pdf417Reader = new BrowserPDF417Reader();
const multiFormatReader = new BrowserMultiFormatReader();

/**
 * Escanea un HTMLImageElement buscando códigos de barras PDF417 o QR impresos en la cédula ecuatoriana.
 * Retorna un objeto DatosCedula con 100% de confianza o null si no se detectó código de barras.
 */
export async function decodificarCodigoBarras(
  imgElement: HTMLImageElement
): Promise<DatosCedula | null> {
  try {
    let result = null;

    // 1. Intentar lectura con BrowserPDF417Reader (Lector oficial de PDF417 de cédulas)
    try {
      result = await pdf417Reader.decodeFromImageElement(imgElement);
    } catch {
      // Fallback: Intentar con lector multiformato (QR, Datamatrix, etc.)
      try {
        result = await multiFormatReader.decodeFromImageElement(imgElement);
      } catch {
        result = null;
      }
    }

    if (!result || !result.getText()) {
      return null;
    }

    const rawText = result.getText();
    console.log('✅ Decodificado exitoso de Código de Barras PDF417 / QR:', rawText);

    // Parsear el contenido decodificado
    const datosParseados = procesarTextoOCR(rawText);

    if (datosParseados.numeroDocumento || datosParseados.primerApellido) {
      return {
        ...datosParseados,
        confianzaDocumento: 100,
        rawText: `[LECTURA PDF417 / BARCODE 100% EXITO]\n${rawText}`,
      };
    }

    return datosParseados;
  } catch (error) {
    console.warn('No se detectó código de barras PDF417/QR en esta imagen:', error);
    return null;
  }
}
