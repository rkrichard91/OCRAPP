import { createWorker } from 'tesseract.js';
import { procesarTextoOCR } from './ocrParser';
import { DatosCedula } from '../types/cedula';

/**
 * Preprocesa una imagen en formato HTMLCanvasElement o HTMLImageElement
 * aplicando escala de grises y contraste para mejorar la lectura de Tesseract.
 */
function preprocesarImagenParaOCR(imageSource: HTMLImageElement | HTMLCanvasElement): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return typeof imageSource === 'string' ? imageSource : (imageSource as HTMLCanvasElement).toDataURL();

  canvas.width = imageSource.width || 1200;
  canvas.height = imageSource.height || 800;

  ctx.drawImage(imageSource, 0, 0, canvas.width, canvas.height);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Escala de grises + ajuste de contraste
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    // Binarización suave (contraste)
    const val = avg > 120 ? Math.min(255, avg * 1.15) : Math.max(0, avg * 0.85);
    data[i] = val;     // R
    data[i + 1] = val; // G
    data[i + 2] = val; // B
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Ejecuta Tesseract.js sobre una imagen (File, Blob, Data URL o Canvas)
 * y retorna los DatosCedula procesados.
 */
export async function ejecutarOcrWeb(
  imageSource: File | Blob | string | HTMLImageElement | HTMLCanvasElement,
  onProgress?: (porcentaje: number, estado: string) => void
): Promise<DatosCedula> {
  let worker = null;
  try {
    if (onProgress) onProgress(10, 'Iniciando motor OCR WebAssembly...');

    worker = await createWorker('spa');

    if (onProgress) onProgress(40, 'Procesando y analizando imagen...');

    let imageUri: string;
    if (typeof imageSource === 'string') {
      imageUri = imageSource;
    } else if (imageSource instanceof File || imageSource instanceof Blob) {
      imageUri = URL.createObjectURL(imageSource);
    } else {
      imageUri = preprocesarImagenParaOCR(imageSource);
    }

    const { data: { text } } = await worker.recognize(imageUri);

    if (onProgress) onProgress(90, 'Extrayendo campos y validando cédula...');

    const resultado = procesarTextoOCR(text || '');

    if (onProgress) onProgress(100, 'Completado');

    return resultado;
  } catch (error) {
    console.error('Error durante ejecución de Tesseract.js:', error);
    return procesarTextoOCR('');
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}
