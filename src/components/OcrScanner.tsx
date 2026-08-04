import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Platform } from 'react-native';
import { procesarTextoOCR } from '../utils/ocrParser';
import { CameraOverlay } from './CameraOverlay';
import { ResultCard } from './ResultCard';
import { DatosCedula } from '../types/cedula';

interface OcrScannerProps {
  onScanSuccess?: (resultado: { numeroDocumento: string; codigoDactilar: string }) => void;
  onCancel?: () => void;
}

export const OcrScanner: React.FC<OcrScannerProps> = ({ onScanSuccess, onCancel }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [torch, setTorch] = useState(false);
  const [datosAcumulados, setDatosAcumulados] = useState<DatosCedula>({
    numeroDocumento: null,
    codigoDactilar: null,
    esCedulaValida: false,
    confianzaDocumento: 0,
    rawText: '',
  });
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    // Solicitar permisos de cámara
    (async () => {
      try {
        // En ambiente nativo móvil se usa Camera.requestCameraPermission()
        setHasPermission(true);
      } catch (err) {
        setHasPermission(false);
      }
    })();
  }, []);

  /**
   * Método invocado en cada cuadro de cámara procesado por ML Kit
   */
  const handleFrameTextDetected = useCallback(
    (textFromOCR: string) => {
      if (modalVisible) return; // No procesar si el resultado ya se está mostrando

      const resultado = procesarTextoOCR(textFromOCR);

      // Acumular si encontramos la cédula en el anverso o el dactilar en el reverso
      setDatosAcumulados((prev) => {
        const nuevoDoc = resultado.numeroDocumento || prev.numeroDocumento;
        const nuevoDactilar = resultado.codigoDactilar || prev.codigoDactilar;
        const esValida = resultado.esCedulaValida || prev.esCedulaValida;

        const actualizados: DatosCedula = {
          numeroDocumento: nuevoDoc,
          codigoDactilar: nuevoDactilar,
          esCedulaValida: esValida,
          confianzaDocumento: Math.max(resultado.confianzaDocumento, prev.confianzaDocumento),
          rawText: textFromOCR,
        };

        // Si tenemos la cédula validada y/o el código dactilar, abrir modal de confirmación
        if (nuevoDoc && esValida && !modalVisible) {
          setModalVisible(true);
        }

        return actualizados;
      });
    },
    [modalVisible]
  );

  const handleSimularEscaneoExitoso = () => {
    // Función de prueba/simulación para probar en emulador/desarrollo sin cámara física
    const mockOCRText = `
      REPUBLICA DEL ECUADOR
      CEDULA DE CIUDADANIA
      NUI: 1710034065
      COD. DACTILAR: V1234I5678
    `;
    handleFrameTextDetected(mockOCRText);
  };

  const handleReintentar = () => {
    setDatosAcumulados({
      numeroDocumento: null,
      codigoDactilar: null,
      esCedulaValida: false,
      confianzaDocumento: 0,
      rawText: '',
    });
    setModalVisible(false);
  };

  const handleConfirmar = (datosFinales: { numeroDocumento: string; codigoDactilar: string }) => {
    setModalVisible(false);
    if (onScanSuccess) {
      onScanSuccess(datosFinales);
    } else {
      Alert.alert(
        '¡Escaneo Completado!',
        `Cédula: ${datosFinales.numeroDocumento}\nDactilar: ${datosFinales.codigoDactilar || 'No registrado'}`
      );
    }
  };

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No se concedieron permisos de cámara.</Text>
        <TouchableOpacity style={styles.btnSecondary} onPress={onCancel}>
          <Text style={styles.btnText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Fondo de vista previa de cámara */}
      <View style={styles.cameraBackground}>
        <Text style={styles.cameraPlaceholderText}>
          [ Visor de Cámara ML Kit Activo ]
        </Text>
      </View>

      {/* Máscara de Escaneo Interactiva */}
      <CameraOverlay
        torchActive={torch}
        onToggleTorch={() => setTorch(!torch)}
        escaneando={!modalVisible}
        documentoDetectado={!!datosAcumulados.numeroDocumento && datosAcumulados.esCedulaValida}
        dactilarDetectado={!!datosAcumulados.codigoDactilar}
        instruccion={
          datosAcumulados.numeroDocumento
            ? 'Cédula detectada. Si desea capturar el Código Dactilar, voltee la cédula.'
            : 'Enfoque el anverso de la cédula dentro del recuadro.'
        }
      />

      {/* Botón Flotante para Demo / Emulador */}
      <View style={styles.demoBar}>
        <TouchableOpacity style={styles.demoButton} onPress={handleSimularEscaneoExitoso}>
          <Text style={styles.demoButtonText}>⚡ Simular Lectura de Cédula</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Confirmación y Edición */}
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
  cameraBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#111827',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  btnSecondary: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  demoBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  demoButton: {
    backgroundColor: 'rgba(0, 229, 255, 0.25)',
    borderWidth: 1,
    borderColor: '#00E5FF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  demoButtonText: {
    color: '#00E5FF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
