export interface DatosCedula {
  numeroDocumento: string | null;
  codigoDactilar: string | null;
  nombres: string | null;
  primerApellido: string | null;
  segundoApellido: string | null;
  fechaNacimiento: string | null;
  nacionalidad: string | null;
  sexo: string | null;
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
