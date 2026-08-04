import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { DatosCedula } from '../types/cedula';
import { validarCedulaEcuatoriana } from '../utils/ecuadorianIdValidator';

interface ResultCardProps {
  visible: boolean;
  datos: DatosCedula | null;
  onConfirm: (datosFinales: { numeroDocumento: string; codigoDactilar: string }) => void;
  onRetry: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  visible,
  datos,
  onConfirm,
  onRetry,
}) => {
  const [cedula, setCedula] = useState('');
  const [dactilar, setDactilar] = useState('');
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  useEffect(() => {
    if (datos) {
      setCedula(datos.numeroDocumento || '');
      setDactilar(datos.codigoDactilar || '');
    }
  }, [datos]);

  useEffect(() => {
    if (cedula.length === 10) {
      const res = validarCedulaEcuatoriana(cedula);
      if (!res.esValido) {
        setErrorValidacion(res.mensajeError || 'Cédula inválida');
      } else {
        setErrorValidacion(null);
      }
    } else if (cedula.length > 0) {
      setErrorValidacion('La cédula debe contener exactamente 10 dígitos.');
    } else {
      setErrorValidacion(null);
    }
  }, [cedula]);

  const handleConfirmar = () => {
    const validacion = validarCedulaEcuatoriana(cedula);
    if (!validacion.esValido) {
      setErrorValidacion(validacion.mensajeError || 'Cédula inválida');
      return;
    }
    onConfirm({
      numeroDocumento: cedula,
      codigoDactilar: dactilar,
    });
  };

  if (!visible || !datos) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>💳 Datos Detectados</Text>
            <Text style={styles.subtitle}>
              Revise y confirme los datos extraídos por el lector OCR:
            </Text>

            {/* Campo Cédula / NUI */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Número de Cédula (NUI):</Text>
              <TextInput
                style={[styles.input, errorValidacion && styles.inputError]}
                value={cedula}
                onChangeText={setCedula}
                keyboardType="numeric"
                maxLength={10}
                placeholder="Ej. 1710034065"
              />
              {errorValidacion ? (
                <Text style={styles.errorText}>⚠️ {errorValidacion}</Text>
              ) : (
                <Text style={styles.successText}>✓ Cédula verificada (Módulo 10)</Text>
              )}
            </View>

            {/* Campo Código Dactilar */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Código Dactilar (Reverso):</Text>
              <TextInput
                style={styles.input}
                value={dactilar}
                onChangeText={(text) => setDactilar(text.toUpperCase())}
                autoCapitalize="characters"
                maxLength={10}
                placeholder="Ej. V1234I5678"
              />
            </View>

            {/* Nivel de Confianza de la lectura */}
            <View style={styles.confidenceContainer}>
              <Text style={styles.confidenceText}>
                Confianza de Lectura: {datos.confianzaDocumento}%
              </Text>
            </View>

            {/* Acciones */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <Text style={styles.retryText}>🔄 Reintentar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, !!errorValidacion && styles.buttonDisabled]}
                onPress={handleConfirmar}
                disabled={!!errorValidacion}
              >
                <Text style={styles.confirmText}>✓ Confirmar Datos</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 24,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: '#D32F2F',
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  successText: {
    color: '#2E7D32',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  confidenceContainer: {
    backgroundColor: '#E8EAF6',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  confidenceText: {
    color: '#3F51B5',
    fontWeight: '600',
    fontSize: 13,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#757575',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  retryText: {
    color: '#424242',
    fontWeight: 'bold',
    fontSize: 15,
  },
  confirmButton: {
    flex: 1.5,
    backgroundColor: '#1B5E20',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
