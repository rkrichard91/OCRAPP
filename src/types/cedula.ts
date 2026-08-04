export interface DatosCedula {
  numeroDocumento: string | null;
  codigoDactilar: string | null;
  esCedulaValida: boolean;
  confianzaDocumento: number; // Porcentaje 0 - 100
  rawText: string;
}

export interface ValidacionCedulaResult {
  esValido: boolean;
  provincia?: number;
  mensajeError?: string;
}

export type ScanStatus = 'idle' | 'scanning' | 'detected' | 'error';
