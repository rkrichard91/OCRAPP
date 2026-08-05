import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, Alert, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { OcrScanner } from './components/OcrScanner';
import { DatosCedula } from './types/cedula';

export function App() {
  const [modoEscaneo, setModoEscaneo] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState<DatosCedula | null>(null);

  const handleScanSuccess = (datos: DatosCedula) => {
    setResultadoFinal(datos);
    setModoEscaneo(false);
  };

  const generarTextoFormateado = (datos: DatosCedula): string => {
    return [
      `Nro Documento: ${datos.numeroDocumento || 'N/A'}`,
      `Codigo Dactilar: ${datos.codigoDactilar || 'N/A'}`,
      `Nombres: ${datos.nombres || 'N/A'}`,
      `1er Apellido: ${datos.primerApellido || 'N/A'}`,
      `2do Apellido: ${datos.segundoApellido || 'N/A'}`,
      `Fecha Nacimiento: ${datos.fechaNacimiento || 'N/A'}`,
      `Nacionalidad: ${datos.nacionalidad || 'N/A'}`,
      `Sexo: ${datos.sexo || 'N/A'}`,
    ].join('\n');
  };

  const handleCopiarTexto = async () => {
    if (!resultadoFinal) return;
    const texto = generarTextoFormateado(resultadoFinal);
    await Clipboard.setStringAsync(texto);
    Alert.alert('📋 ¡Copiado!', 'Datos copiados al portapapeles:\n\n' + texto);
  };

  if (modoEscaneo) {
    return (
      <SafeAreaView style={styles.flexContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <OcrScanner
          onScanSuccess={handleScanSuccess}
          onCancel={() => setModoEscaneo(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F6" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>🇪🇨 Escáner OCR de Cédula</Text>
          <Text style={styles.description}>
            Reconocimiento inteligente de documentos de identidad ecuatorianos con lectura de 8 parámetros y verificación matemática Módulo 10.
          </Text>

          {resultadoFinal ? (
            <View style={styles.resultBox}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>📌 Cédula Registrada:</Text>
                <TouchableOpacity style={styles.copyBadge} onPress={handleCopiarTexto}>
                  <Text style={styles.copyBadgeText}>📋 Copiar Texto</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dataGrid}>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Nro Documento:</Text>
                  <Text style={styles.dataValue}>{resultadoFinal.numeroDocumento || 'N/A'}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Codigo Dactilar:</Text>
                  <Text style={styles.dataValue}>{resultadoFinal.codigoDactilar || 'N/A'}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Nombres:</Text>
                  <Text style={styles.dataValue}>{resultadoFinal.nombres || 'N/A'}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>1er Apellido:</Text>
                  <Text style={styles.dataValue}>{resultadoFinal.primerApellido || 'N/A'}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>2do Apellido:</Text>
                  <Text style={styles.dataValue}>{resultadoFinal.segundoApellido || 'N/A'}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Fecha Nacimiento:</Text>
                  <Text style={styles.dataValue}>{resultadoFinal.fechaNacimiento || 'N/A'}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Nacionalidad:</Text>
                  <Text style={styles.dataValue}>{resultadoFinal.nacionalidad || 'N/A'}</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Sexo:</Text>
                  <Text style={styles.dataValue}>{resultadoFinal.sexo || 'N/A'}</Text>
                </View>
              </View>

              {resultadoFinal.esCedulaValida && (
                <Text style={styles.badgeValid}>✓ Verificado por algoritmo Módulo 10</Text>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No hay cédulas escaneadas aún.</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setModoEscaneo(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.scanButtonText}>📷 Iniciar Escáner de Cédula</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContainer: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyState: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  resultBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#166534',
  },
  copyBadge: {
    backgroundColor: '#15803D',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  copyBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dataGrid: {
    gap: 6,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#DCFCE7',
  },
  dataLabel: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '500',
  },
  dataValue: {
    color: '#111827',
    fontWeight: 'bold',
    fontSize: 13,
  },
  badgeValid: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;
