import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { procesarTextoOCR } from '../utils/ocrParser';
import { CameraOverlay } from './CameraOverlay';
import { ResultCard } from './ResultCard';
import { DatosCedula } from '../types/cedula';

interface OcrScannerProps {
  onScanSuccess?: (resultado: DatosCedula) => void;
  onCancel?: () => void;
}

export const OcrScanner: React.FC<OcrScannerProps> = ({ onScanSuccess, onCancel }) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const cameraRef = useRef<Camera>(null);

  const [torch, setTorch] = useState(false);
  const [procesandoCaptura, setProcesandoCaptura] = useState(false);
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
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // Solicitar permiso de cámara explícitamente al cargar la vista
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  /**
   * Procesa el texto detectado y actualiza el estado acumulado
   */
  const handleTextDetected = useCallback(
    (textFromOCR: string) => {
      if (modalVisible) return;

      const resultado = procesarTextoOCR(textFromOCR);

      setDatosAcumulados((prev) => {
        const nuevoDoc = resultado.numeroDocumento || prev.numeroDocumento;
        const nuevoDactilar = resultado.codigoDactilar || prev.codigoDactilar;
        const nuevosNombres = resultado.nombres || prev.nombres;
        const nuevo1erApellido = resultado.primerApellido || prev.primerApellido;
        const nuevo2doApellido = resultado.segundoApellido || prev.segundoApellido;
        const nuevaFechaNac = resultado.fechaNacimiento || prev.fechaNacimiento;
        const nuevaNac = resultado.nacionalidad || prev.nacionalidad;
        const nuevoSexo = resultado.sexo || prev.sexo;
        const esValida = resultado.esCedulaValida || prev.esCedulaValida;

        const actualizados: DatosCedula = {
          numeroDocumento: nuevoDoc,
          codigoDactilar: nuevoDactilar,
          nombres: nuevosNombres,
          primerApellido: nuevo1erApellido,
          segundoApellido: nuevo2doApellido,
          fechaNacimiento: nuevaFechaNac,
          nacionalidad: nuevaNac,
          sexo: nuevoSexo,
          esCedulaValida: esValida,
          confianzaDocumento: Math.max(resultado.confianzaDocumento, prev.confianzaDocumento),
          rawText: textFromOCR,
        };

        if ((nuevoDoc && esValida) || nuevoDactilar || nuevosNombres) {
          setModalVisible(true);
        }

        return actualizados;
      });
    },
    [modalVisible]
  );

  /**
   * Captura foto directamente con la cámara en vivo y ejecuta ML Kit OCR
   */
  const handleCapturarFotoOCR = async () => {
    if (!cameraRef.current || procesandoCaptura) return;
    try {
      setProcesandoCaptura(true);
      const photo = await cameraRef.current.takePhoto({
        flash: torch ? 'on' : 'off',
        enableShutterSound: false,
      });

      const photoPath = Platform.OS === 'android' ? `file://${photo.path}` : photo.path;
      const result = await TextRecognition.recognize(photoPath);

      if (result && result.text) {
        handleTextDetected(result.text);
      } else {
        Alert.alert('Aviso', 'No se pudo leer texto en la imagen. Enfoque bien el documento e intente de nuevo.');
      }
    } catch (error) {
      console.error('Error al capturar foto u OCR:', error);
      Alert.alert('Error', 'Ocurrió un error al procesar la foto con la cámara.');
    } finally {
      setProcesandoCaptura(false);
    }
  };

  const handleSimularEscaneoExitoso = () => {
    const mockOCRText = `
      REPUBLICA DEL ECUADOR
      CEDULA DE CIUDADANIA
      NUI: 1710034065
      APELLIDOS: PEREZ ROCA
      NOMBRES: JUAN CARLOS
      FECHA DE NACIMIENTO: 15/04/1990
      NACIONALIDAD: ECUATORIANA
      SEXO: MASCULINO
      COD. DACTILAR: V1234I5678
    `;
    handleTextDetected(mockOCRText);
  };

  const handleReintentar = () => {
    setDatosAcumulados({
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
    setModalVisible(false);
  };

  const handleConfirmar = (datosFinales: DatosCedula) => {
    setModalVisible(false);
    if (onScanSuccess) {
      onScanSuccess(datosFinales);
    } else {
      Alert.alert('¡Escaneo Completado!', `Cédula ${datosFinales.numeroDocumento} registrada con éxito.`);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>📷 Se requieren permisos de cámara</Text>
        <Text style={styles.errorSubtitle}>
          Para escanear cédulas es necesario autorizar el acceso a la cámara.
        </Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={requestPermission}>
          <Text style={styles.btnPrimaryText}>Conceder Permiso</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={onCancel}>
          <Text style={styles.btnText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No se detectó un dispositivo de cámara activo.</Text>
        <TouchableOpacity style={styles.btnSecondary} onPress={onCancel}>
          <Text style={styles.btnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Vista de Cámara en Vivo con Vision Camera */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!modalVisible}
        photo={true}
        torch={torch ? 'on' : 'off'}
      />

      {/* Máscara de Escaneo Guiada */}
      <CameraOverlay
        torchActive={torch}
        onToggleTorch={() => setTorch(!torch)}
        escaneando={!modalVisible && !procesandoCaptura}
        documentoDetectado={!!datosAcumulados.numeroDocumento && datosAcumulados.esCedulaValida}
        dactilarDetectado={!!datosAcumulados.codigoDactilar}
        instruccion={
          procesandoCaptura
            ? 'Procesando lectura OCR...'
            : datosAcumulados.numeroDocumento
            ? 'Cédula detectada. Enfoque el reverso para código dactilar.'
            : 'Ubique la cédula dentro del recuadro y presione Escanear.'
        }
      />

      {/* Barra Inferior con Botón Principal de Captura OCR y Simulación */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.captureButton, procesandoCaptura && styles.buttonDisabled]}
          onPress={handleCapturarFotoOCR}
          disabled={procesandoCaptura}
          activeOpacity={0.8}
        >
          <Text style={styles.captureButtonText}>
            {procesandoCaptura ? '⏳ Analizando OCR...' : '📸 ESCANEAR CÉDULA'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.demoButton} onPress={handleSimularEscaneoExitoso}>
          <Text style={styles.demoButtonText}>⚡ Simular Demo (Prueba)</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Confirmación, Edición y Copiado de los 8 Parámetros */}
      <ResultCard
        visible={modalVisible}
        datos={datosAcumulados}
        onConfirm={handleConfirmar}
        onRetry={handleReintentar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#111827',
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  btnPrimary: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  btnSecondary: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  captureButton: {
    backgroundColor: '#2563EB',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#4B5563',
  },
  captureButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  demoButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: '#00E5FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  demoButtonText: {
    color: '#00E5FF',
    fontWeight: '600',
    fontSize: 13,
  },
});
