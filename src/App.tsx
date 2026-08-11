import React, { useState } from 'react';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { WebCameraScanner } from './components/WebCameraScanner';
import { VerificationResultModal } from './components/VerificationResultModal';
import { ejecutarOcrWeb } from './utils/webOcrEngine';
import { consultarCedulaAPI, enriquecerConDatosAPI } from './services/verificationService';
import { DatosCedula, ApiVerificationResult } from './types/cedula';
import { ShieldCheck, Cpu, Database, CheckCircle2, Lock } from 'lucide-react';

export const App: React.FC = () => {
  const [modoActivo, setModoActivo] = useState<'camara' | 'archivos'>('archivos');
  const [cargando, setCargando] = useState(false);
  const [progresoMensaje, setProgresoMensaje] = useState('');

  const [datosAcumulados, setDatosAcumulados] = useState<DatosCedula>({
    numeroDocumento: null,
    codigoDactilar: null,
    nombres: null,
    primerApellido: null,
    segundoApellido: null,
    fechaNacimiento: null,
    nacionalidad: null,
    sexo: null,
    esCedulaValida: false,
    confianzaDocumento: 0,
    rawText: '',
  });

  const [apiResult, setApiResult] = useState<ApiVerificationResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  /**
   * Procesa imágenes cargadas desde archivos (Frente y/o Reverso)
   */
  const handleProcesarArchivos = async (frente: File | null, reverso: File | null) => {
    setCargando(true);
    let doc: string | null = null;
    let dactilar: string | null = null;
    let nom: string | null = null;
    let ap1: string | null = null;
    let ap2: string | null = null;
    let fec: string | null = null;
    let nac: string | null = null;
    let sex: string | null = null;
    let valida = false;
    let maxConf = 0;
    let rawStr = '';

    try {
      if (frente) {
        setProgresoMensaje('Analizando foto del FRENTE...');
        const resFrente = await ejecutarOcrWeb(frente, (pct, msg) => setProgresoMensaje(`Frente: ${msg}`));
        if (resFrente.numeroDocumento) doc = resFrente.numeroDocumento;
        if (resFrente.nombres) nom = resFrente.nombres;
        if (resFrente.primerApellido) ap1 = resFrente.primerApellido;
        if (resFrente.segundoApellido) ap2 = resFrente.segundoApellido;
        if (resFrente.fechaNacimiento) fec = resFrente.fechaNacimiento;
        if (resFrente.nacionalidad) nac = resFrente.nacionalidad;
        if (resFrente.sexo) sex = resFrente.sexo;
        if (resFrente.esCedulaValida) valida = true;
        maxConf = Math.max(maxConf, resFrente.confianzaDocumento);
        rawStr += '\n' + resFrente.rawText;
      }

      if (reverso) {
        setProgresoMensaje('Analizando foto del REVERSO (Código Dactilar / MRZ)...');
        const resReverso = await ejecutarOcrWeb(reverso, (pct, msg) => setProgresoMensaje(`Reverso: ${msg}`));
        if (resReverso.numeroDocumento && !doc) doc = resReverso.numeroDocumento;
        if (resReverso.codigoDactilar) dactilar = resReverso.codigoDactilar;
        if (resReverso.nombres && !nom) nom = resReverso.nombres;
        if (resReverso.primerApellido && !ap1) ap1 = resReverso.primerApellido;
        if (resReverso.segundoApellido && !ap2) ap2 = resReverso.segundoApellido;
        if (resReverso.esCedulaValida) valida = true;
        maxConf = Math.max(maxConf, resReverso.confianzaDocumento);
        rawStr += '\n' + resReverso.rawText;
      }

      let datosFinales: DatosCedula = {
        numeroDocumento: doc,
        codigoDactilar: dactilar,
        nombres: nom,
        primerApellido: ap1,
        segundoApellido: ap2,
        fechaNacimiento: fec,
        nacionalidad: nac,
        sexo: sex,
        esCedulaValida: valida,
        confianzaDocumento: maxConf,
        rawText: rawStr.trim(),
      };

      // Si existe un número de cédula, consultar la API pública de verificación y autocompletar campos faltantes
      if (doc) {
        setProgresoMensaje('Consultando API de Verificación Oficial en Ecuador...');
        const apiRes = await consultarCedulaAPI(doc);
        setApiResult(apiRes);
        if (apiRes && apiRes.exito && apiRes.nombreCompletoOficial) {
          datosFinales = enriquecerConDatosAPI(datosFinales, apiRes);
        }
      } else {
        setApiResult(null);
      }

      setDatosAcumulados(datosFinales);
      setModalVisible(true);
    } catch (error) {
      console.error('Error al procesar archivos:', error);
    } finally {
      setCargando(false);
    }
  };

  /**
   * Procesa la captura en tiempo real desde la cámara web
   */
  const handleCapturarFotoCamara = async (
    canvas: HTMLCanvasElement,
    lado: 'frente' | 'reverso',
    abrirModalDirecto: boolean = false
  ) => {
    setCargando(true);
    setProgresoMensaje(`Analizando captura de la cámara (${lado.toUpperCase()})...`);
    try {
      const res = await ejecutarOcrWeb(canvas, (pct, msg) => setProgresoMensaje(msg));

      let actualizados: DatosCedula = {
        numeroDocumento: res.numeroDocumento || datosAcumulados.numeroDocumento,
        codigoDactilar: res.codigoDactilar || datosAcumulados.codigoDactilar,
        nombres: res.nombres || datosAcumulados.nombres,
        primerApellido: res.primerApellido || datosAcumulados.primerApellido,
        segundoApellido: res.segundoApellido || datosAcumulados.segundoApellido,
        fechaNacimiento: res.fechaNacimiento || datosAcumulados.fechaNacimiento,
        nacionalidad: res.nacionalidad || datosAcumulados.nacionalidad,
        sexo: res.sexo || datosAcumulados.sexo,
        esCedulaValida: res.esCedulaValida || datosAcumulados.esCedulaValida,
        confianzaDocumento: Math.max(res.confianzaDocumento, datosAcumulados.confianzaDocumento),
        rawText: (datosAcumulados.rawText + '\n' + res.rawText).trim(),
      };

      if (actualizados.numeroDocumento) {
        const apiRes = await consultarCedulaAPI(actualizados.numeroDocumento);
        setApiResult(apiRes);
        if (apiRes && apiRes.exito && apiRes.nombreCompletoOficial) {
          actualizados = enriquecerConDatosAPI(actualizados, apiRes);
        }
      }

      setDatosAcumulados(actualizados);

      // Mostrar modal al escanear el reverso o si el usuario hace clic en Ver Resultados
      if (lado === 'reverso' || abrirModalDirecto) {
        setModalVisible(true);
      }
    } catch (err) {
      console.error('Error al procesar foto de cámara:', err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="app-container">
      <Header modoActivo={modoActivo} onCambiarModo={setModoActivo} />

      <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {modoActivo === 'archivos' ? (
          <FileUploader
            onProcesarImagenes={handleProcesarArchivos}
            cargando={cargando}
            progresoMensaje={progresoMensaje}
          />
        ) : (
          <WebCameraScanner
            onCapturarFoto={handleCapturarFotoCamara}
            cargando={cargando}
            onVerResultados={() => setModalVisible(true)}
            tieneDatos={Boolean(datosAcumulados.numeroDocumento || datosAcumulados.primerApellido)}
          />
        )}

        {/* FEATURE HIGHLIGHTS */}
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-main)' }}>
            ✨ Capacidades y Seguridad de la Plataforma Web
          </h3>

          <div className="main-grid">
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <Cpu size={24} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>OCR WebAssembly Tesseract.js</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Reconocimiento óptico de caracteres 100% en el cliente sin instalar descargas o APKs.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <Database size={24} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Consulta API SRI / Verificación</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Contrasta el NUI con servicios públicos de verificación ecuatoriana para corroborar nombres oficiales.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <CheckCircle2 size={24} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Validación Módulo 10</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Verifica el dígito verificador matemático y código provincial del Registro Civil de Ecuador.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <Lock size={24} color="var(--accent-purple)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Privacidad de Datos</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Las imágenes no se guardan en servidores externos, cumpliendo con la Ley de Protección de Datos.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {modalVisible && (
        <VerificationResultModal
          datos={datosAcumulados}
          apiResult={apiResult}
          onCerrar={() => setModalVisible(false)}
        />
      )}
    </div>
  );
};

export default App;
