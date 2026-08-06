import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';

interface CameraOverlayProps {
  torchActive: boolean;
  onToggleTorch: () => void;
  escaneando: boolean;
  pasoActual: 'frente' | 'reverso';
  frenteCapturado: boolean;
  reversoCapturado: boolean;
  instruccion?: string;
}

const { width } = Dimensions.get('window');

// Formato ID-1 (Cédula): Proporción 1.586 (300px ancho -> 190px alto)
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = CARD_WIDTH / 1.586;

export const CameraOverlay: React.FC<CameraOverlayProps> = ({
  torchActive,
  onToggleTorch,
  escaneando,
  pasoActual,
  frenteCapturado,
  reversoCapturado,
  instruccion,
}) => {
  const borderColor = frenteCapturado && reversoCapturado
    ? '#4CAF50'
    : frenteCapturado || reversoCapturado
    ? '#FFC107'
    : '#00E5FF';

  const textoPasoHeader = pasoActual === 'frente'
    ? 'PASO 1 DE 2: FRENTE DE LA CÉDULA'
    : 'PASO 2 DE 2: REVERSO DE LA CÉDULA';

  const textoInstruccionPredeterminada = pasoActual === 'frente'
    ? 'Enfoque el FRENTE de la cédula dentro del recuadro.'
    : 'Enfoque el REVERSO de la cédula dentro del recuadro.';

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Máscara Superior con Encabezado de Paso */}
      <View style={styles.maskTop}>
        <View style={styles.headerStepContainer}>
          <Text style={styles.headerStepText}>{textoPasoHeader}</Text>
        </View>
      </View>

      {/* Máscara Central con Recuadro Transparente */}
      <View style={styles.maskMiddle}>
        <View style={styles.maskLeft} />
        
        {/* Recuadro Guía de la Cédula */}
        <View style={[styles.targetBox, { borderColor }]}>
          {/* Esquinas decorativas */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Etiqueta flotante del paso dentro del marco */}
          <View style={styles.frameLabelContainer}>
            <Text style={styles.frameLabelText}>
              {pasoActual === 'frente' ? '🖼️ ANVERSO / FRENTE' : '🔄 REVERSO / DACTILAR'}
            </Text>
          </View>

          {/* Línea de escaneo animada visual */}
          {escaneando && <View style={styles.scanLine} />}
        </View>

        <View style={styles.maskRight} />
      </View>

      {/* Máscara Inferior e Indicadores de Captura */}
      <View style={styles.maskBottom}>
        <Text style={styles.instructionText}>{instruccion || textoInstruccionPredeterminada}</Text>

        {/* Indicadores de Detección de ambas caras */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, frenteCapturado && styles.badgeSuccess]}>
            <Text style={styles.badgeText}>
              {frenteCapturado ? '✓ 1. Frente Capturado' : '○ 1. Frente (Anverso)'}
            </Text>
          </View>

          <View style={[styles.statusBadge, reversoCapturado && styles.badgeSuccess]}>
            <Text style={styles.badgeText}>
              {reversoCapturado ? '✓ 2. Reverso Capturado' : '○ 2. Reverso (Dactilar)'}
            </Text>
          </View>
        </View>

        {/* Botón de Linterna/Flash */}
        <TouchableOpacity
          style={[styles.torchButton, torchActive && styles.torchButtonActive]}
          onPress={onToggleTorch}
          activeOpacity={0.7}
        >
          <Text style={styles.torchText}>
            {torchActive ? '⚡ Linterna ENCENDIDA' : '💡 Encender Linterna'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  maskTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
  },
  headerStepContainer: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#00E5FF',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  headerStepText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  maskMiddle: {
    height: CARD_HEIGHT,
    flexDirection: 'row',
  },
  maskLeft: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  maskRight: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  targetBox: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderWidth: 2,
    borderRadius: 12,
    position: 'relative',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameLabelContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  frameLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  maskBottom: {
    flex: 1.2,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#00E5FF',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  scanLine: {
    height: 2,
    backgroundColor: '#00E5FF',
    width: '100%',
    position: 'absolute',
    top: '50%',
    shadowColor: '#00E5FF',
    shadowRadius: 8,
    shadowOpacity: 1,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeSuccess: {
    backgroundColor: '#2E7D32',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  torchButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  torchButtonActive: {
    backgroundColor: '#FFB300',
    borderColor: '#FFA000',
  },
  torchText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
