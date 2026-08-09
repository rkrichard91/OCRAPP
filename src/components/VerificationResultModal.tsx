import React, { useState } from 'react';
import { DatosCedula, ApiVerificationResult } from '../types/cedula';
import { ShieldCheck, Copy, Check, AlertTriangle, FileText, X } from 'lucide-react';

interface VerificationResultModalProps {
  datos: DatosCedula;
  apiResult: ApiVerificationResult | null;
  onCerrar: () => void;
}

export const VerificationResultModal: React.FC<VerificationResultModalProps> = ({
  datos,
  apiResult,
  onCerrar,
}) => {
  const [copiado, setCopiado] = useState(false);

  const handleCopiarTexto = () => {
    const textoResumen = [
      `• NÚMERO DE CÉDULA: ${datos.numeroDocumento || 'N/A'}`,
      `• CÓDIGO DACTILAR: ${datos.codigoDactilar || 'N/A'}`,
      `• 1er APELLIDO: ${datos.primerApellido || 'N/A'}`,
      `• 2do APELLIDO: ${datos.segundoApellido || 'N/A'}`,
      `• NOMBRES: ${datos.nombres || 'N/A'}`,
      `• FECHA DE NACIMIENTO: ${datos.fechaNacimiento || 'N/A'}`,
      `• NACIONALIDAD: ${datos.nacionalidad || 'N/A'}`,
      `• SEXO: ${datos.sexo || 'N/A'}`,
    ].join('\n');

    navigator.clipboard.writeText(textoResumen);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 13, 22, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000,
        overflowY: 'auto',
      }}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: '650px',
          width: '100%',
          padding: '2rem',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
      >
        <button
          onClick={onCerrar}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: 'white',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* HEADER MODAL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: datos.esCedulaValida ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: datos.esCedulaValida ? '#34d399' : '#f87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {datos.esCedulaValida ? <ShieldCheck size={26} /> : <AlertTriangle size={26} />}
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {datos.esCedulaValida ? 'Cédula Verificada Exitosamente' : 'Cédula No Validada'}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Confianza del OCR: {datos.confianzaDocumento}%
            </span>
          </div>
        </div>

        {/* API STATUS BOX */}
        {apiResult && (
          <div
            style={{
              background: apiResult.exito ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${apiResult.exito ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span className={`badge ${apiResult.exito ? 'badge-success' : 'badge-warning'}`}>
                {apiResult.fuente}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                NUI: {apiResult.cedula}
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {apiResult.mensaje}
            </p>
            {apiResult.nombreCompletoOficial && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#34d399', fontWeight: 700 }}>
                Nombres Oficiales SRI: {apiResult.nombreCompletoOficial}
              </div>
            )}
          </div>
        )}

        {/* FIELDS GRID */}
        <div className="data-fields-grid">
          <div className="data-field-item">
            <span className="field-label">NUI / Número Cédula</span>
            <span className="field-value mono">{datos.numeroDocumento || 'No detectado'}</span>
          </div>

          <div className="data-field-item">
            <span className="field-label">Código Dactilar</span>
            <span className="field-value mono" style={{ color: 'var(--accent-cyan)' }}>
              {datos.codigoDactilar || 'No detectado'}
            </span>
          </div>

          <div className="data-field-item">
            <span className="field-label">1er Apellido</span>
            <span className="field-value">{datos.primerApellido || 'N/A'}</span>
          </div>

          <div className="data-field-item">
            <span className="field-label">2do Apellido</span>
            <span className="field-value">{datos.segundoApellido || 'N/A'}</span>
          </div>

          <div className="data-field-item">
            <span className="field-label">Nombres</span>
            <span className="field-value">{datos.nombres || 'N/A'}</span>
          </div>

          <div className="data-field-item">
            <span className="field-label">Fecha Nacimiento</span>
            <span className="field-value">{datos.fechaNacimiento || 'N/A'}</span>
          </div>

          <div className="data-field-item">
            <span className="field-label">Nacionalidad</span>
            <span className="field-value">{datos.nacionalidad || 'N/A'}</span>
          </div>

          <div className="data-field-item">
            <span className="field-label">Sexo / Género</span>
            <span className="field-value">{datos.sexo || 'N/A'}</span>
          </div>
        </div>

        {/* ACCIONES */}
        <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={handleCopiarTexto}>
            {copiado ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
            <span>{copiado ? '¡Copiado!' : 'Copiar Texto'}</span>
          </button>
          <button className="btn btn-primary" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
