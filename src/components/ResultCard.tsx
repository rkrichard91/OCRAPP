import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { DatosCedula } from '../types/cedula';
import { validarCedulaEcuatoriana } from '../utils/ecuadorianIdValidator';

interface ResultCardProps {
  visible: boolean;
  datos: DatosCedula | null;
  onConfirm: (datosFinales: DatosCedula) => void;
  onRetry: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  visible,
  datos,
  onConfirm,
  onRetry,
}) => {
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [codigoDactilar, setCodigoDactilar] = useState('');
  const [nombres, setNombres] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [nacionalidad, setNacionalidad] = useState('');
  const [sexo, setSexo] = useState('');
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  useEffect(() => {
    if (datos) {
      setNumeroDocumento(datos.numeroDocumento || '');
      setCodigoDactilar(datos.codigoDactilar || '');
      setNombres(datos.nombres || '');
      setPrimerApellido(datos.primerApellido || '');
      setSegundoApellido(datos.segundoApellido || '');
      setFechaNacimiento(datos.fechaNacimiento || '');
      setNacionalidad(datos.nacionalidad || 'ECUATORIANA');
      setSexo(datos.sexo || '');
    }
  }, [datos]);

  useEffect(() => {
    if (numeroDocumento.length === 10) {
      const res = validarCedulaEcuatoriana(numeroDocumento);
      if (!res.esValido) {
        setErrorValidacion(res.mensajeError || 'Cédula inválida');
      } else {
        setErrorValidacion(null);
      }
    } else if (numeroDocumento.length > 0) {
      setErrorValidacion('La cédula debe contener exactamente 10 dígitos.');
    } else {
      setErrorValidacion(null);
    }
  }, [numeroDocumento]);

  /**
   * Genera la cadena formateada en pares clave-valor solicitada
   */
  const generarTextoFormateado = (): string => {
    return [
      `Nro Documento: ${numeroDocumento || 'N/A'}`,
      `Codigo Dactilar: ${codigoDactilar || 'N/A'}`,
      `Nombres: ${nombres || 'N/A'}`,
      `1er Apellido: ${primerApellido || 'N/A'}`,
      `2do Apellido: ${segundoApellido || 'N/A'}`,
      `Fecha Nacimiento: ${fechaNacimiento || 'N/A'}`,
      `Nacionalidad: ${nacionalidad || 'N/A'}`,
      `Sexo: ${sexo || 'N/A'}`,
    ].join('\n');
  };

  const handleCopiarAlPortapapeles = async () => {
    const texto = generarTextoFormateado();
    await Clipboard.setStringAsync(texto);
    Alert.alert('📋 ¡Copiado!', 'Los 8 parámetros de la cédula fueron copiados al portapapeles en formato de texto.');
  };

  const handleConfirmar = () => {
    if (numeroDocumento.length > 0) {
      const validacion = validarCedulaEcuatoriana(numeroDocumento);
      if (!validacion.esValido) {
        setErrorValidacion(validacion.mensajeError || 'Cédula inválida');
        return;
      }
    }

    const datosFinales: DatosCedula = {
      numeroDocumento: numeroDocumento || null,
      codigoDactilar: codigoDactilar || null,
      nombres: nombres || null,
      primerApellido: primerApellido || null,
      segundoApellido: segundoApellido || null,
      fechaNacimiento: fechaNacimiento || null,
      nacionalidad: nacionalidad || null,
      sexo: sexo || null,
      esCedulaValida: !errorValidacion && numeroDocumento.length === 10,
      confianzaDocumento: datos?.confianzaDocumento || 80,
      rawText: datos?.rawText || '',
    };

    onConfirm(datosFinales);
  };

  if (!visible || !datos) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>💳 Datos Detectados</Text>
            <Text style={styles.subtitle}>
              Revise, edite y copie los 8 parámetros detectados por el OCR:
            </Text>

            {/* 1. Nro Documento */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nro Documento:</Text>
              <TextInput
                style={[styles.input, errorValidacion ? styles.inputError : null]}
                value={numeroDocumento}
                onChangeText={setNumeroDocumento}
                keyboardType="numeric"
                maxLength={10}
                placeholder="Ej. 1710034065"
              />
              {errorValidacion ? (
                <Text style={styles.errorText}>⚠️ {errorValidacion}</Text>
              ) : numeroDocumento.length === 10 ? (
                <Text style={styles.successText}>✓ Cédula verificada (Módulo 10)</Text>
              ) : null}
            </View>

            {/* 2. Código Dactilar */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Codigo Dactilar:</Text>
              <TextInput
                style={styles.input}
                value={codigoDactilar}
                onChangeText={(t) => setCodigoDactilar(t.toUpperCase())}
                autoCapitalize="characters"
                maxLength={10}
                placeholder="Ej. V1234I5678"
              />
            </View>

            {/* 3. Nombres */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombres:</Text>
              <TextInput
                style={styles.input}
                value={nombres}
                onChangeText={setNombres}
                autoCapitalize="words"
                placeholder="Ej. JUAN CARLOS"
              />
            </View>

            {/* 4. 1er Apellido */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>1er Apellido:</Text>
              <TextInput
                style={styles.input}
                value={primerApellido}
                onChangeText={setPrimerApellido}
                autoCapitalize="words"
                placeholder="Ej. PEREZ"
              />
            </View>

            {/* 5. 2do Apellido */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>2do Apellido:</Text>
              <TextInput
                style={styles.input}
                value={segundoApellido}
                onChangeText={setSegundoApellido}
                autoCapitalize="words"
                placeholder="Ej. ROCA"
              />
            </View>

            {/* 6. Fecha Nacimiento */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha Nacimiento:</Text>
              <TextInput
                style={styles.input}
                value={fechaNacimiento}
                onChangeText={setFechaNacimiento}
                placeholder="Ej. 15/04/1990"
              />
            </View>

            {/* 7. Nacionalidad */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nacionalidad:</Text>
              <TextInput
                style={styles.input}
                value={nacionalidad}
                onChangeText={setNacionalidad}
                autoCapitalize="characters"
                placeholder="Ej. ECUATORIANA"
              />
            </View>

            {/* 8. Sexo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sexo:</Text>
              <TextInput
                style={styles.input}
                value={sexo}
                onChangeText={setSexo}
                autoCapitalize="characters"
                placeholder="Ej. MASCULINO / FEMENINO"
              />
            </View>

            {/* Botón de Copiado Rápido al Portapapeles */}
            <TouchableOpacity style={styles.copyButton} onPress={handleCopiarAlPortapapeles} activeOpacity={0.8}>
              <Text style={styles.copyButtonText}>📋 Copiar en Formato Texto</Text>
            </TouchableOpacity>

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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  successText: {
    color: '#166534',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  copyButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#6B7280',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  retryText: {
    color: '#374151',
    fontWeight: 'bold',
    fontSize: 15,
  },
  confirmButton: {
    flex: 1.5,
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
