import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { Camera, useCameraDevice, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as ImagePicker from 'expo-image-picker';
import { procesarTextoOCR } from '../utils/ocrParser';
import { CameraOverlay } from './CameraOverlay';
import { ResultCard } from './ResultCard';
import { DatosCedula } from '../types/cedula';

interface OcrScannerProps {
  onScanSuccess?: (resultado: DatosCedula) => void;
  onCancel?: () => void;
  autoOpenGallery?: boolean;
}

export const OcrScanner: React.FC<OcrScannerProps> = ({ onScanSuccess, onCancel, autoOpenGallery }) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const backDevice = useCameraDevice('back');
  
  const device = backDevice ?? devices.find((d) => d.position === 'back') ?? devices[0];
  const cameraRef = useRef<Camera>(null);

  const [torch, setTorch] = useState(false);
  const [procesandoCaptura, setProcesandoCaptura] = useState(false);
  const [pasoActual, setPasoActual] = useState<'frente' | 'reverso'>('frente');
  const [frenteCapturado, setFrenteCapturado] = useState(false);
  const [reversoCapturado, setReversoCapturado] = useState(false);

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
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    if (autoOpenGallery) {
      handleSeleccionarImagenGaleria();
    }
  }, [autoOpenGallery]);

  /**
   * Procesa la imagen desde la Galería de Fotos / Sistema de Archivos
   */
  const handleSeleccionarImagenGaleria = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permiso Denegado 📁', 'Se requiere acceso a la galería para seleccionar una imagen de la cédula.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setProcesandoCaptura(true);
      const imageUri = result.assets[0].uri;

      const ocrResult = await TextRecognition.recognize(imageUri);
      const textoReconocido = ocrResult?.text || '';

      if (!textoReconocido || textoReconocido.trim().length === 0) {
        Alert.alert('⚠️ Sin Texto', 'No se pudo detectar texto en la imagen seleccionada. Asegúrese de elegir una foto clara de la cédula.');
        return;
      }

      const resultado = procesarTextoOCR(textoReconocido);

      if (!resultado.numeroDocumento && !resultado.nombres && !resultado.codigoDactilar) {
        Alert.alert(
          '⚠️ Sin Cédula Detectada',
          'No se identificaron patrones de cédula ecuatoriana en la foto seleccionada. Intente subir una imagen más nítida, sin reflejos y bien enfocado el documento.'
        );
      }

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
          rawText: (prev.rawText + '\n' + textoReconocido).trim(),
        };

        setFrenteCapturado(true);
        setModalVisible(true);
        return actualizados;
      });
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      Alert.alert('Error', 'Ocurrió un error al procesar la imagen de la galería.');
    } finally {
      setProcesandoCaptura(false);
    }
  };

  /**
   * Captura foto del paso activo (Frente o Reverso) y ejecuta ML Kit OCR
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
      const textoReconocido = result?.text || '';

      const resultado = procesarTextoOCR(textoReconocido);

      if (pasoActual === 'frente' && !resultado.numeroDocumento && !resultado.nombres) {
        Alert.alert(
          '💡 Consejo de Lectura',
          'La lectura no detectó número de cédula o nombres de forma clara. Pruebe encender la linterna, evitar reflejos directos y mantener la cámara firme.',
          [{ text: 'Continuar de todos modos' }]
        );
      }

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
          rawText: (prev.rawText + '\n' + textoReconocido).trim(),
        };

        if (pasoActual === 'frente') {
          setFrenteCapturado(true);
          setPasoActual('reverso');
          Alert.alert(
            '¡Frente Capturado! 📸',
            'Si desea capturar el Código Dactilar, coloque la cédula por el REVERSO y presione "Capturar Reverso". También puede revisar los datos capturados.',
            [
              { text: 'Capturar Reverso', style: 'default' },
              { text: 'Ver Datos Ahora', onPress: () => setModalVisible(true) },
            ]
          );
        } else {
          setReversoCapturado(true);
          setModalVisible(true);
        }

        return actualizados;
      });
    } catch (error) {
      console.error('Error al capturar foto u OCR:', error);
      Alert.alert('Error', 'Ocurrió un error al procesar la foto de la cédula.');
    } finally {
      setProcesandoCaptura(false);
    }
  };

  const handleSimularEscaneoExitoso = () => {
    const mockOCRTextFrente = `
      REPUBLICA DEL ECUADOR
      CEDULA DE CIUDADANIA
      NUI: 1710034065
      APELLIDOS: PEREZ ROCA
      NOMBRES: JUAN CARLOS
      FECHA DE NACIMIENTO: 15/04/1990
      NACIONALIDAD: ECUATORIANA
      SEXO: MASCULINO
    `;
    const mockOCRTextReverso = `
      REPUBLICA DEL ECUADOR
      COD. DACTILAR: V1234I5678
    `;
    
    const resFrente = procesarTextoOCR(mockOCRTextFrente);
    const resReverso = procesarTextoOCR(mockOCRTextReverso);

    const consolidados: DatosCedula = {
      numeroDocumento: resFrente.numeroDocumento,
      codigoDactilar: resReverso.codigoDactilar,
      nombres: resFrente.nombres,
      primerApellido: resFrente.primerApellido,
      segundoApellido: resFrente.segundoApellido,
      fechaNacimiento: resFrente.fechaNacimiento,
      nacionalidad: resFrente.nacionalidad,
      sexo: resFrente.sexo,
      esCedulaValida: resFrente.esCedulaValida,
      confianzaDocumento: 100,
      rawText: mockOCRTextFrente + '\n' + mockOCRTextReverso,
    };

    setDatosAcumulados(consolidados);
    setFrenteCapturado(true);
    setReversoCapturado(true);
    setModalVisible(true);
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
    setFrenteCapturado(false);
    setReversoCapturado(false);
    setPasoActual('frente');
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
          Para escanear cédulas es necesario autorizar el acceso a la cámara o cargar desde archivo.
        </Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={requestPermission}>
          <Text style={styles.btnPrimaryText}>Conceder Permiso Cámara</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnGallery} onPress={handleSeleccionarImagenGaleria}>
          <Text style={styles.btnGalleryText}>🖼️ Cargar Foto desde Galería</Text>
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
        <Text style={styles.errorTitle}>📷 Cargando Cámara...</Text>
        <Text style={styles.errorSubtitle}>
          Inicializando sensores de cámara del dispositivo. Puede cargar una imagen desde archivo o simular el escaneo.
        </Text>
        <TouchableOpacity style={styles.btnGallery} onPress={handleSeleccionarImagenGaleria}>
          <Text style={styles.btnGalleryText}>🖼️ Cargar Foto desde Galería</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleSimularEscaneoExitoso}>
          <Text style={styles.btnPrimaryText}>⚡ Simular Demo</Text>
        </TouchableOpacity>
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

      {/* Máscara de Escaneo Guiada de 2 Pasos */}
      <CameraOverlay
        torchActive={torch}
        onToggleTorch={() => setTorch(!torch)}
        escaneando={!modalVisible && !procesandoCaptura}
        pasoActual={pasoActual}
        frenteCapturado={frenteCapturado}
        reversoCapturado={reversoCapturado}
        instruccion={
          procesandoCaptura
            ? `Analizando OCR del ${pasoActual.toUpperCase()}...`
            : pasoActual === 'frente'
            ? 'Enfoque el FRENTE (Anverso) y presione "Capturar Frente"'
            : 'Enfoque el REVERSO (Dactilar) y presione "Capturar Reverso"'
        }
      />

      {/* Barra Inferior con Botón Principal de Captura y Cargar Imagen */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.captureButton, procesandoCaptura && styles.buttonDisabled]}
          onPress={handleCapturarFotoOCR}
          disabled={procesandoCaptura}
          activeOpacity={0.8}
        >
          <Text style={styles.captureButtonText}>
            {procesandoCaptura
              ? '⏳ Analizando Imagen...'
              : pasoActual === 'frente'
              ? '📸 1. CAPTURAR FRENTE'
              : '📸 2. CAPTURAR REVERSO'}
          </Text>
        </TouchableOpacity>

        <View style={styles.secondaryActionsRow}>
          <TouchableOpacity
            style={[styles.galleryButton, procesandoCaptura && styles.buttonDisabled]}
            onPress={handleSeleccionarImagenGaleria}
            disabled={procesandoCaptura}
          >
            <Text style={styles.galleryButtonText}>🖼️ Archivo / Galería</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoButton} onPress={handleSimularEscaneoExitoso}>
            <Text style={styles.demoButtonText}>⚡ Demo</Text>
          </TouchableOpacity>
        </View>

        {frenteCapturado && (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.reviewButtonText}>📋 Ver Datos Extraídos (8 Campos)</Text>
          </TouchableOpacity>
        )}
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
  btnPrimary: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  btnGallery: {
    backgroundColor: '#7C3AED',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  btnGalleryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  btnSecondary: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    alignItems: 'center',
    gap: 10,
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
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 10,
  },
  galleryButton: {
    flex: 1,
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  galleryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  reviewButton: {
    backgroundColor: '#059669',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  demoButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: '#00E5FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoButtonText: {
    color: '#00E5FF',
    fontWeight: '600',
    fontSize: 13,
  },
});

