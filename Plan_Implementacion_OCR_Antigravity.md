# Plan de Implementación Técnica: Motor OCR Móvil para Cédulas Ecuatorianas

**Plataforma Destino:** React Native / Expo (Android & iOS)
**Entorno de Despliegue:** Dispositivos Móviles Nativos (APK / AAB / IPA)
**Stack Tecnológico:** TypeScript, React Native, Google ML Kit, Vision Camera

---

## 1. Arquitectura y Viabilidad Móvil Real

Este proyecto implementa un sistema de reconocimiento óptico de caracteres (OCR) optimizado para dispositivos móviles celulares. Garantiza alta precisión mediante 4 pilares:

1. **Validación Matemática de Cédula Ecuatoriana (Módulo 10):** Filtra falsos positivos (números de teléfono, fechas) asegurando que solo se acepten cédulas auténticas.
2. **Normalización y Corrección de Errores de OCR:** Corrige confusiones de contraste comunes en cámaras de teléfonos (ej. reemplazar `O` por `0`, `I` por `1`, `S` por `5`).
3. **Máscara Guía ID-1:** Proporciona un marco visual ajustado a la proporción estándar de la cédula con control de linterna/flash y feedback visual en tiempo real.
4. **Edición y Confirmación Manual (Modal ResultCard):** Permite al usuario revisar y corregir datos antes de procesarlos.

---

## 2. Estructura del Código Creado

```
d:\OCRAPP\
├── src\
│   ├── types\
│   │   └── cedula.ts              # Tipos TypeScript (DatosCedula, ValidacionResult)
│   ├── utils\
│   │   ├── ecuadorianIdValidator.ts # Algoritmo Módulo 10 oficial de Ecuador
│   │   ├── ocrParser.ts           # Parser inteligente con corrección de OCR y Regex
│   │   └── ocrParser.test.ts      # Suite de pruebas unitarias automatizadas
│   ├── components\
│   │   ├── CameraOverlay.tsx      # Máscara visual con linterna e indicadores
│   │   ├── ResultCard.tsx         # Modal de confirmación y edición de datos
│   │   └── OcrScanner.tsx         # Orquestador del flujo de escaneo y cámara
│   └── App.tsx                    # Componente principal de la app móvil
├── package.json                   # Dependencias y scripts de prueba
└── Plan_Implementacion_OCR_Antigravity.md
```

---

## 3. Algoritmo Módulo 10 de Cédula Ecuatoriana

Ubicación: [ecuadorianIdValidator.ts](file:///d:/OCRAPP/src/utils/ecuadorianIdValidator.ts)

- **Provincia:** Primeros 2 dígitos entre `01` y `24`, o `30`.
- **Tercer Dígito:** Debe ser menor a 6 (`< 6`) para personas naturales.
- **Coeficientes Módulo 10:** `[2, 1, 2, 1, 2, 1, 2, 1, 2]`. Si el producto de la multiplicación es `>= 10`, se le resta `9`.
- **Verificación:** Si `sum % 10 === 0`, el dígito verificador es `0`, de lo contrario `10 - (sum % 10)`.

---

## 4. Parser Inteligente de OCR

Ubicación: [ocrParser.ts](file:///d:/OCRAPP/src/utils/ocrParser.ts)

- **Número de Documento (NUI):** Extrae patrones de 10 dígitos y valida cada candidato con `validarCedulaEcuatoriana()`.
- **Código Dactilar:** Detecta el formato del reverso de la cédula (`[A-Z]\d{4}[A-Z]\d{4}`, ej. `V1234I5678`) o mediante etiquetas como `COD. DACTILAR`.
- **Confianza:** Otorga un porcentaje de confianza del 0% al 100% según los campos validados con éxito.

---

## 5. Ejecución de Pruebas Automatizadas

Para validar el algoritmo y los casos de prueba de OCR en la consola:

```bash
npm test
```

---

## 6. Despliegue en Dispositivo Móvil

1. **Permisos de Cámara (Android):** Declarados en `AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-feature android:name="android.hardware.camera" android:required="true" />
   ```
2. **Ejecución en Teléfono Android / Emulador:**
   ```bash
   npm run android
   ```
