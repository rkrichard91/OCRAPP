import React, { useState, useRef, useEffect } from 'react';
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
  const [isDraggingFrente, setIsDraggingFrente] = useState(false);
  const [isDraggingReverso, setIsDraggingReverso] = useState(false);

  const inputFrenteRef = useRef<HTMLInputElement>(null);
  const inputReversoRef = useRef<HTMLInputElement>(null);

  // Prevenir que el navegador abra el archivo si se arrastra fuera de los drops
  useEffect(() => {
    const preventWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragover', preventWindowDrop);
    window.addEventListener('drop', preventWindowDrop);

    return () => {
      window.removeEventListener('dragover', preventWindowDrop);
      window.removeEventListener('drop', preventWindowDrop);
    };
  }, []);

  const handleSelectFrente = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setFrenteFile(file);
    setFrentePreview(URL.createObjectURL(file));
  };

  const handleSelectReverso = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setReversoFile(file);
    setReversoPreview(URL.createObjectURL(file));
  };

  const handleFrenteDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingFrente) setIsDraggingFrente(true);
  };

  const handleFrenteDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFrente(false);
  };

  const handleFrenteDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFrente(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectFrente(e.dataTransfer.files[0]);
    }
  };

  const handleReversoDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingReverso) setIsDraggingReverso(true);
  };

  const handleReversoDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingReverso(false);
  };

  const handleReversoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingReverso(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectReverso(e.dataTransfer.files[0]);
    }
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
          Selecciona o arrastra la foto del <strong>Frente</strong> (Principal) y/o <strong>Reverso</strong> (Opcional).
        </p>
      </div>

      <div className="main-grid">
        {/* FRENTE */}
        <div
          className={`upload-zone ${frenteFile ? 'has-file' : ''} ${isDraggingFrente ? 'dragover' : ''}`}
          onClick={() => inputFrenteRef.current?.click()}
          onDragOver={handleFrenteDragOver}
          onDragEnter={handleFrenteDragOver}
          onDragLeave={handleFrenteDragLeave}
          onDrop={handleFrenteDrop}
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
                <CheckCircle size={14} /> Frente Cargado (Principal)
              </div>
            </div>
          ) : (
            <>
              <div className="upload-icon">
                <FileImage size={28} />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  1. Foto del FRENTE (Principal)
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
          className={`upload-zone ${reversoFile ? 'has-file' : ''} ${isDraggingReverso ? 'dragover' : ''}`}
          onClick={() => inputReversoRef.current?.click()}
          onDragOver={handleReversoDragOver}
          onDragEnter={handleReversoDragOver}
          onDragLeave={handleReversoDragLeave}
          onDrop={handleReversoDrop}
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
                <CheckCircle size={14} /> Reverso Cargado (Opcional)
              </div>
            </div>
          ) : (
            <>
              <div className="upload-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-gold)' }}>
                <FileImage size={28} />
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                  2. Foto del REVERSO (Opcional)
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Código Dactilar y banda MRZ (opcional)
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

      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleEjecutarOCR}
            disabled={(!frenteFile && !reversoFile) || cargando}
            style={{ opacity: (!frenteFile && !reversoFile) || cargando ? 0.5 : 1 }}
          >
            <Upload size={18} />
            <span>
              {frenteFile && !reversoFile
                ? 'Procesar Foto del Frente (Solo Frente)'
                : !frenteFile && reversoFile
                ? 'Procesar Foto del Reverso'
                : 'Procesar OCR y Verificación API'}
            </span>
          </button>

          {(frenteFile || reversoFile) && !cargando && (
            <button className="btn btn-secondary" onClick={handleReset}>
              <RefreshCw size={18} />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {frenteFile && !reversoFile && (
          <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>
            ℹ️ Solo cargaste la foto del frente. El reverso es opcional.
          </span>
        )}
      </div>
    </div>
  );
};
