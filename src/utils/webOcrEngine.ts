import { createWorker, Worker } from 'tesseract.js';
import { procesarTextoOCR } from './ocrParser';
import { DatosCedula } from '../types/cedula';

/**
 * Convierte cualquier tipo de entrada de imagen a un objeto HTMLImageElement
 */
function cargarHTMLImage(source: File | Blob | string | HTMLCanvasElement | HTMLImageElement): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (source instanceof HTMLImageElement) {
      if (source.complete) return resolve(source);
      source.onload = () => resolve(source);
      source.onerror = reject;
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;

    if (source instanceof HTMLCanvasElement) {
      img.src = source.toDataURL('image/png');
    } else if (source instanceof File || source instanceof Blob) {
      img.src = URL.createObjectURL(source);
    } else if (typeof source === 'string') {
      img.src = source;
    } else {
      reject(new Error('Tipo de fuente de imagen no soportado'));
    }
  });
}

/**
 * Rota una imagen en el canvas (0, 90, 180, 270 grados) y aplica escala de grises + contraste
 */
function prepararCanvasRotadoYFiltrado(img: HTMLImageElement, grados: 0 | 90 | 180 | 270): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  const esRotadoVertical = grados === 90 || grados === 270;
  canvas.width = esRotadoVertical ? img.height : img.width;
  canvas.height = esRotadoVertical ? img.width : img.height;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((grados * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  // Preprocesamiento de imagen: Grayscale + Ajuste de contraste para Tesseract
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    // Binarización y realce de texto para Tesseract
    const val = avg > 120 ? Math.min(255, avg * 1.15) : Math.max(0, avg * 0.85);
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * Calcula un puntaje de calidad del resultado parseado para elegir la mejor rotación
 */
function calcularPuntajeOCR(datos: DatosCedula): number {
  let score = 0;
  if (datos.primerApellido) score += 30;
  if (datos.nombres) score += 30;
  if (datos.codigoDactilar) score += 25;
  if (datos.numeroDocumento && datos.esCedulaValida) score += 20;
  if (datos.fechaNacimiento) score += 15;
  if (datos.sexo) score += 10;
  return score;
}

/**
 * Ejecuta Tesseract.js sobre una imagen (File, Blob, Data URL o Canvas)
 * probando múltiples orientaciones (0°, 90°, 270°, 180°) hasta obtener la lectura óptima.
 */
export async function ejecutarOcrWeb(
  imageSource: File | Blob | string | HTMLImageElement | HTMLCanvasElement,
  onProgress?: (porcentaje: number, estado: string) => void
): Promise<DatosCedula> {
  let worker: Worker | null = null;
  try {
    if (onProgress) onProgress(10, 'Iniciando motor OCR WebAssembly...');

    const imgElement = await cargarHTMLImage(imageSource);
    worker = await createWorker('spa');

    const angulos: (0 | 90 | 270 | 180)[] = [0, 90, 270, 180];
    let mejorResultado: DatosCedula = procesarTextoOCR('');
    let mejorPuntaje = -1;

    for (let idx = 0; idx < angulos.length; idx++) {
      const angulo = angulos[idx];
      const pctBase = 20 + idx * 20;

      if (onProgress) onProgress(pctBase, `Optimizando orientación (${angulo}°)...`);

      const uriProcesada = prepararCanvasRotadoYFiltrado(imgElement, angulo);
      const { data: { text } } = await worker.recognize(uriProcesada);

      const resultado = procesarTextoOCR(text || '');
      const puntaje = calcularPuntajeOCR(resultado);

      if (puntaje > mejorPuntaje) {
        mejorPuntaje = puntaje;
        mejorResultado = resultado;
      }

      // Si encontramos datos clave con buena confianza (nombres, apellido o dactilar), no hace falta probar más rotaciones
      if (puntaje >= 50) {
        break;
      }
    }

    if (onProgress) onProgress(100, 'Lectura completada');
    return mejorResultado;
  } catch (error) {
    console.error('Error durante ejecución de Tesseract.js:', error);
    return procesarTextoOCR('');
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}
