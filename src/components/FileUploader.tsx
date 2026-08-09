import React, { useState, useRef } from 'react';
import { Upload, FileImage, CheckCircle, RefreshCw } from 'lucide-react';

interface FileUploaderProps {
  onProcesarImagenes: (frente: File | null, reverso: File | null) => void;
  cargando: boolean;
  progresoMensaje: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onProcesarImagenes,
  cargando,
  progresoMensaje,
}) => {
  const [frenteFile, setFrenteFile] = useState<File | null>(null);
  const [reversoFile, setReversoFile] = useState<File | null>(null);
  const [frentePreview, setFrentePreview] = useState<string | null>(null);
  const [reversoPreview, setReversoPreview] = useState<string | null>(null);

  const inputFrenteRef = useRef<HTMLInputElement>(null);
  const inputReversoRef = useRef<HTMLInputElement>(null);

  const handleSelectFrente = (file: File) => {
    setFrenteFile(file);
    setFrentePreview(URL.createObjectURL(file));
  };

  const handleSelectReverso = (file: File) => {
    setReversoFile(file);
    setReversoPreview(URL.createObjectURL(file));
  };

  const handleEjecutarOCR = () => {
    if (!frenteFile && !reversoFile) return;
    onProcesarImagenes(frenteFile, reversoFile);
  };

  const handleReset = () => {
    setFrenteFile(null);
    setReversoFile(null);
    setFrentePreview(null);
    setReversoPreview(null);
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
          🖼️ Cargar Fotos de la Cédula
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Selecciona o arrastra la foto del <strong>Frente</strong> y/o <strong>Reverso</strong> de la Cédula Ecuatoriana.
        </p>
      </div>

      <div className="main-grid">
        {/* FRENTE */}
        <div
          className={`upload-zone ${frenteFile ? 'has-file' : ''}`}
          onClick={() => inputFrenteRef.current?.click()}
        >
          <input
            type="file"
            ref={inputFrenteRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleSelectFrente(e.target.files[0])}
          />
          {frentePreview ? (
            <div style={{ width: '100%', position: 'relative' }}>
              <img
                src={frentePreview}
                alt="Frente"
                style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px' }}
              />
              <div className="badge badge-success" style={{ marginTop: '0.5rem' }}>
                <CheckCircle size={14} /> Frente Cargado
              </div>
            </div>
          ) : (
            <>
              <div className="upload-icon">
                <FileImage size={28} />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  1. Foto del FRENTE
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Haz clic para buscar o arrastra la imagen aquí
                </span>
              </div>
            </>
          )}
        </div>

        {/* REVERSO */}
        <div
          className={`upload-zone ${reversoFile ? 'has-file' : ''}`}
          onClick={() => inputReversoRef.current?.click()}
        >
          <input
            type="file"
            ref={inputReversoRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleSelectReverso(e.target.files[0])}
          />
          {reversoPreview ? (
            <div style={{ width: '100%', position: 'relative' }}>
              <img
                src={reversoPreview}
                alt="Reverso"
                style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px' }}
              />
              <div className="badge badge-success" style={{ marginTop: '0.5rem' }}>
                <CheckCircle size={14} /> Reverso Cargado (Dactilar / MRZ)
              </div>
            </div>
          ) : (
            <>
              <div className="upload-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-gold)' }}>
                <FileImage size={28} />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  2. Foto del REVERSO
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Código Dactilar y banda MRZ
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {cargando && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 0.75rem auto' }}></div>
          <p style={{ fontSize: '0.9rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
            {progresoMensaje}
          </p>
        </div>
      )}

      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button
          className="btn btn-primary"
          onClick={handleEjecutarOCR}
          disabled={(!frenteFile && !reversoFile) || cargando}
          style={{ opacity: (!frenteFile && !reversoFile) || cargando ? 0.5 : 1 }}
        >
          <Upload size={18} />
          <span>Procesar OCR y Verificación API</span>
        </button>

        {(frenteFile || reversoFile) && !cargando && (
          <button className="btn btn-secondary" onClick={handleReset}>
            <RefreshCw size={18} />
            <span>Limpiar</span>
          </button>
        )}
      </div>
    </div>
  );
};
