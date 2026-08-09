import React from 'react';
import { Camera, Upload, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  modoActivo: 'camara' | 'archivos';
  onCambiarModo: (modo: 'camara' | 'archivos') => void;
}

export const Header: React.FC<HeaderProps> = ({ modoActivo, onCambiarModo }) => {
  return (
    <header className="glass-panel header">
      <div className="brand">
        <div className="brand-icon">🇪🇨</div>
        <div>
          <h1 className="brand-title">OCR Cédula Ecuador</h1>
          <p className="brand-subtitle">Escáner Web con Verificación Módulo 10 & API Oficial</p>
        </div>
      </div>

      <div className="mode-switcher">
        <button
          className={`tab-btn ${modoActivo === 'camara' ? 'active' : ''}`}
          onClick={() => onCambiarModo('camara')}
        >
          <Camera size={18} />
          <span>Cámara En Vivo</span>
        </button>
        <button
          className={`tab-btn ${modoActivo === 'archivos' ? 'active' : ''}`}
          onClick={() => onCambiarModo('archivos')}
        >
          <Upload size={18} />
          <span>Subir Fotos</span>
        </button>
      </div>

      <div className="badge badge-info">
        <ShieldCheck size={14} />
        <span>API Verificación Conectada</span>
      </div>
    </header>
  );
};
