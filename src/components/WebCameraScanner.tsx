import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, RefreshCw, AlertCircle, FileText } from 'lucide-react';

interface WebCameraScannerProps {
  onCapturarFoto: (canvas: HTMLCanvasElement, lado: 'frente' | 'reverso', abrirModalDirecto?: boolean) => void;
  cargando: boolean;
  onVerResultados?: () => void;
  tieneDatos?: boolean;
}

export const WebCameraScanner: React.FC<WebCameraScannerProps> = ({
  onCapturarFoto,
  cargando,
  onVerResultados,
  tieneDatos,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paso, setPaso] = useState<'frente' | 'reverso'>('frente');
  const [frenteCapturado, setFrenteCapturado] = useState(false);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);

  useEffect(() => {
    iniciarCamara();
    return () => detenerCamara();
  }, []);

  const iniciarCamara = async () => {
    setErrorCamara(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Usar cámara trasera en celulares
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCamaraActiva(true);
      }
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setErrorCamara('No se pudo acceder a la cámara. Verifique los permisos en su navegador o intente con la opción de subir archivos.');
      setCamaraActiva(false);
    }
  };

  const detenerCamara = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCamaraActiva(false);
    }
  };

  const handleTomarFoto = (abrirModalDirecto: boolean = false) => {
    if (!videoRef.current || !camaraActiva) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      onCapturarFoto(canvas, paso, abrirModalDirecto);
      if (paso === 'frente') {
        setFrenteCapturado(true);
        setPaso('reverso');
      }
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            📷 Captura de Cédula ({paso === 'frente' ? 'FRENTE - Principal' : 'REVERSO - Opcional'})
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            El <strong>Frente</strong> es suficiente para obtener los datos y verificación. El <strong>Reverso</strong> es opcional.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn ${paso === 'frente' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => setPaso('frente')}
          >
            1. Frente {frenteCapturado ? '✓' : ''}
          </button>
          <button
            type="button"
            className={`btn ${paso === 'reverso' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => setPaso('reverso')}
          >
            2. Reverso (Opcional)
          </button>
        </div>
      </div>

      {frenteCapturado && paso === 'reverso' && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            color: '#34d399',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle size={18} />
          <span>
            <strong>¡Foto del Frente procesada!</strong> Puedes escanear el REVERSO a continuación o hacer clic en <em>Finalizar y Ver Resultados</em>.
          </span>
        </div>
      )}

      {errorCamara ? (
        <div style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#f87171' }}>
          <AlertCircle size={36} style={{ marginBottom: '0.5rem' }} />
          <p>{errorCamara}</p>
          <button className="btn btn-secondary" onClick={iniciarCamara} style={{ marginTop: '1rem' }}>
            <RefreshCw size={16} /> Reintentar Permiso
          </button>
        </div>
      ) : (
        <div className="camera-wrapper">
          <video ref={videoRef} className="camera-video" playsInline muted />
          <div className="camera-overlay-frame">
            <span className="camera-guide-text">
              {paso === 'frente' ? 'Ubique el FRENTE de la cédula' : 'Ubique el REVERSO (Código Dactilar - Opcional)'}
            </span>
          </div>
        </div>
      )}

      <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          onClick={() => handleTomarFoto(false)}
          disabled={!camaraActiva || cargando}
          style={{ opacity: !camaraActiva || cargando ? 0.5 : 1 }}
        >
          <Camera size={18} />
          <span>Capturar Foto ({paso === 'frente' ? 'FRENTE' : 'REVERSO'})</span>
        </button>

        {(tieneDatos || frenteCapturado) && onVerResultados && (
          <button className="btn btn-emerald" onClick={onVerResultados}>
            <FileText size={18} />
            <span>Finalizar y Ver Resultados</span>
          </button>
        )}

        {paso === 'reverso' && frenteCapturado && (
          <button className="btn btn-secondary" onClick={() => setPaso('frente')}>
            Volver a Frente
          </button>
        )}
      </div>
    </div>
  );
};
