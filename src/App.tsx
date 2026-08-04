import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, Alert } from 'react-native';
import { OcrScanner } from './components/OcrScanner';

export function App() {
  const [modoEscaneo, setModoEscaneo] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState<{
    numeroDocumento: string;
    codigoDactilar: string;
  } | null>(null);

  const handleScanSuccess = (datos: { numeroDocumento: string; codigoDactilar: string }) => {
    setResultadoFinal(datos);
    setModoEscaneo(false);
    Alert.alert(
      '¡Captura Exitosa!',
      `Cédula Registrada: ${datos.numeroDocumento}\nCódigo Dactilar: ${datos.codigoDactilar || 'N/A'}`
    );
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
      <View style={styles.card}>
        <Text style={styles.title}>🇪🇨 Escáner OCR de Cédula</Text>
        <Text style={styles.description}>
          Sistema móvil de reconocimiento de documentos de identidad ecuatorianos con validación matemática de Módulo 10.
        </Text>

        {resultadoFinal ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>📌 Último Documento Escaneado:</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Número de Cédula (NUI):</Text>
              <Text style={styles.resultValue}>{resultadoFinal.numeroDocumento}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Código Dactilar:</Text>
              <Text style={styles.resultValue}>{resultadoFinal.codigoDactilar || 'No capturado'}</Text>
            </View>
            <Text style={styles.badgeValid}>✓ Verificado por Módulo 10</Text>
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
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
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
    marginBottom: 24,
  },
  emptyState: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    color: '#374151',
    fontSize: 14,
  },
  resultValue: {
    color: '#111827',
    fontWeight: 'bold',
    fontSize: 14,
  },
  badgeValid: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
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
