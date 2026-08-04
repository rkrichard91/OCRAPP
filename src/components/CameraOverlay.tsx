import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';

interface CameraOverlayProps {
  torchActive: boolean;
  onToggleTorch: () => void;
  escaneando: boolean;
  documentoDetectado: boolean;
  dactilarDetectado: boolean;
  instruccion?: string;
}

const { width, height } = Dimensions.get('window');

// Formato ID-1 (Cédula): Proporción 1.586 (300px ancho -> 190px alto)
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = CARD_WIDTH / 1.586;

export const CameraOverlay: React.FC<CameraOverlayProps> = ({
  torchActive,
  onToggleTorch,
  escaneando,
  documentoDetectado,
  dactilarDetectado,
  instruccion = 'Coloque la cédula dentro del recuadro',
}) => {
  const borderColor = documentoDetectado && dactilarDetectado
    ? '#4CAF50'
    : documentoDetectado || dactilarDetectado
    ? '#FFC107'
    : '#00E5FF';

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Máscara Superior */}
      <View style={styles.maskTop} />

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

          {/* Línea de escaneo animada visual */}
          {escaneando && <View style={styles.scanLine} />}
        </View>

        <View style={styles.maskRight} />
      </View>

      {/* Máscara Inferior y Controles */}
      <View style={styles.maskBottom}>
        <Text style={styles.instructionText}>{instruccion}</Text>

        {/* Indicadores de Detección */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, documentoDetectado && styles.badgeSuccess]}>
            <Text style={styles.badgeText}>
              {documentoDetectado ? '✓ Cédula' : '○ Cédula (Anverso)'}
            </Text>
          </View>

          <View style={[styles.statusBadge, dactilarDetectado && styles.badgeSuccess]}>
            <Text style={styles.badgeText}>
              {dactilarDetectado ? '✓ C. Dactilar' : '○ Dactilar (Reverso)'}
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
  },
  maskBottom: {
    flex: 1.2,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    paddingTop: 20,
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
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  badgeSuccess: {
    backgroundColor: '#2E7D32',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  torchButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 12,
    paddingHorizontal: 24,
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
    fontSize: 14,
  },
});
