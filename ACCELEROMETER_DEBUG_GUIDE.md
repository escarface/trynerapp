# Guía de Debugging del Acelerómetro - TrynerApp

## Resumen de Cambios Implementados

He agregado logging extensivo en todo el pipeline del acelerómetro para identificar exactamente dónde se está rompiendo el flujo de datos.

### Archivos Modificados

1. **SensorAdapter.ts** - Wrapper del acelerómetro
2. **MotionEngine.ts** - Orquestador central
3. **useMotionEngine.ts** - Hook de React
4. **ActiveWorkoutScreen.tsx** - Pantalla de workout

---

## Cómo Probar

### 1. Rebuild de la App (IMPORTANTE)

Dado que agregamos logs en archivos TypeScript que no están en hot reload, necesitas hacer rebuild:

```bash
cd /Users/maitellerenasobrino/Documents/development/Tryner_App/TrynerApp/trynerapp

# iOS
npx expo run:ios

# Android
npx expo run:android
```

### 2. Navega al Workout Activo

1. Abre la app
2. Inicia sesión (o registrate)
3. En el Home, toca "Iniciar Workout"
4. Configura un workout de Sentadillas
5. Inicia el workout → Esto te lleva a `ActiveWorkoutScreen`

### 3. Observa los Logs en la Consola

Deberías ver una secuencia de logs como esta:

```
[ActiveWorkout] 🎬 Component mounted, initializing workout...
[ActiveWorkout] Calling start()...
[useMotionEngine] 🚀 Start requested...
[MotionEngine] 🎬 Starting motion detection...
[SensorAdapter] 🚀 Starting accelerometer...
[SensorAdapter] Sensor available: true
[SensorAdapter] Permission status: granted
[SensorAdapter] Session start time: 1703168800000
[SensorAdapter] Setting update interval: 16.666 ms ( 60 Hz)
[SensorAdapter] ✅ Listener registered. Waiting for data...
[MotionEngine] ✅ Motion detection started successfully
[useMotionEngine] ✅ Start completed successfully
[ActiveWorkout] ✅ start() completed
[ActiveWorkout] ✅ Initialization complete
[useMotionEngine] 📊 Starting data sync interval (10 Hz)

# Luego deberías ver datos:
[SensorAdapter] Sample #1: { x: '0.012', y: '-0.034', z: '-0.981' }
[SensorAdapter] Sample #2: { x: '0.015', y: '-0.031', z: '-0.979' }
[SensorAdapter] Sample #3: { x: '0.011', y: '-0.036', z: '-0.982' }
[MotionEngine] Processing data #1: { x: '0.012', y: '-0.034', z: '-0.981', timestamp: 0 }
[MotionEngine] Processing data #2: { x: '0.015', y: '-0.031', z: '-0.979', timestamp: 16 }
[MotionEngine] Processing data #3: { x: '0.011', y: '-0.036', z: '-0.982', timestamp: 33 }

# Y cada segundo:
[MotionEngine] Buffer size: 60 samples
[useMotionEngine] Data sync update #10: 60 samples
[ActiveWorkout] ✅ First accelerometer data received: 60 samples
```

---

## Diagnóstico por Escenarios

### ✅ ESCENARIO 1: Todo funciona
**Logs esperados:**
- Ves todos los logs de inicialización
- Ves "Sample #1, #2, #3" del SensorAdapter
- Ves "Processing data #1, #2, #3" del MotionEngine
- Ves "First accelerometer data received" en ActiveWorkout
- La UI muestra los valores del acelerómetro (no "Esperando datos...")

**Acción:** ¡Nada! Ya está funcionando.

---

### ❌ ESCENARIO 2: Sensor no disponible
**Logs esperados:**
```
[SensorAdapter] Sensor available: false
[SensorAdapter] ❌ Error: Accelerometer not available on this device
```

**Causa:** Estás en un simulador, no en un dispositivo físico.

**Solución:**
- El acelerómetro SOLO funciona en dispositivos físicos reales
- Conecta tu iPhone o iPad vía USB
- Ejecuta `npx expo run:ios --device`

---

### ❌ ESCENARIO 3: Permisos denegados (Android)
**Logs esperados:**
```
[SensorAdapter] Permission status: denied
[SensorAdapter] ❌ Error: Accelerometer permission denied
```

**Causa:** En Android 12+, el usuario denegó el permiso HIGH_SAMPLING_RATE_SENSORS.

**Solución:**
1. Ve a Configuración del dispositivo
2. Apps → TrynerApp → Permisos
3. Habilita "Sensores de movimiento" o "High sampling rate sensors"

---

### ❌ ESCENARIO 4: Sensor inicia pero NO llegan datos
**Logs esperados:**
```
[SensorAdapter] ✅ Listener registered. Waiting for data...
[MotionEngine] ✅ Motion detection started successfully
[useMotionEngine] 📊 Starting data sync interval (10 Hz)

# Pero NUNCA ves:
[SensorAdapter] Sample #1: ...   ← NUNCA APARECE
```

**Causa:** El listener del acelerómetro se registró pero no está disparando callbacks.

**Soluciones posibles:**

#### A. Verificar que es un dispositivo físico
```bash
# Listar dispositivos conectados
xcrun xctrace list devices  # iOS
adb devices                 # Android
```

#### B. Reiniciar el acelerómetro manualmente
Agrega un botón de debug temporal en `ActiveWorkoutScreen.tsx`:

```typescript
<Button
  title="Test Accelerometer"
  onPress={async () => {
    const isAvailable = await Accelerometer.isAvailableAsync();
    console.log('Direct check - Available:', isAvailable);

    Accelerometer.setUpdateInterval(100);
    const subscription = Accelerometer.addListener((data) => {
      console.log('DIRECT LISTENER:', data);
    });

    setTimeout(() => subscription.remove(), 5000);
  }}
/>
```

#### C. Verificar que expo-sensors está compilado correctamente
```bash
cd ios
pod install
cd ..
npx expo run:ios
```

---

### ❌ ESCENARIO 5: Datos llegan al MotionEngine pero NO al componente React
**Logs esperados:**
```
[SensorAdapter] Sample #1, #2, #3...  ✅
[MotionEngine] Processing data #1, #2, #3...  ✅
[MotionEngine] Buffer size: 60 samples  ✅
[useMotionEngine] Data sync update #10: 60 samples  ✅

# Pero NUNCA ves:
[ActiveWorkout] ✅ First accelerometer data received...  ❌
```

**Causa:** El problema está en la sincronización de Reanimated shared values con React state.

**Solución:**
1. Verifica que `react-native-reanimated` está instalado correctamente
2. Asegúrate de que el plugin de Babel está configurado en `babel.config.js`:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',  // ← DEBE estar ÚLTIMO
      // otros plugins...
    ],
  };
};
```

3. Rebuild completo:
```bash
rm -rf node_modules ios android
npm install
npx expo prebuild --clean
npx expo run:ios
```

---

### ❌ ESCENARIO 6: Datos llegan al componente pero la UI dice "Esperando datos..."
**Logs esperados:**
```
[ActiveWorkout] ✅ First accelerometer data received: 60 samples  ✅
```

**Pero la UI muestra:** "Esperando datos del acelerómetro..."

**Causa:** El estado de React `displayAccelData` se está actualizando, pero el componente no se está re-renderizando.

**Solución:**
Agrega un log temporal en `AccelerometerGraph.tsx`:

```typescript
// En el render, antes del if (data.length === 0)
console.log('[AccelerometerGraph] Rendering with data length:', data.length);
```

Si ves `data.length: 0` en los logs pero sabes que hay datos, hay un problema de sincronización.

---

## Información Técnica Importante

### iOS y Permisos del Acelerómetro

**CRÍTICO:** En iOS, el acelerómetro (y giroscopio) NO requieren permisos del usuario. Son sensores de "movimiento básico" que están disponibles por defecto.

- `NSMotionUsageDescription` en `Info.plist` es OPCIONAL y solo se usa para claridad
- `Accelerometer.requestPermissionsAsync()` SIEMPRE devolverá `granted` en iOS
- NO aparecerá un popup de permisos en iOS para el acelerómetro

**SOLO se requiere permiso para:**
- Motion & Fitness tracking (CMMotionActivityManager)
- Pedometer (CMPedometer)

El acelerómetro básico está siempre disponible sin popup.

### Android y HIGH_SAMPLING_RATE_SENSORS

En Android 12+ (API 31+), el permiso `HIGH_SAMPLING_RATE_SENSORS` es necesario si quieres sampling rates > 200 Hz.

Nuestro target es 60 Hz, así que técnicamente no lo necesitamos, pero lo agregamos por precaución.

---

## Siguiente Paso

**Por favor ejecuta la app y copia TODOS los logs que veas** en la consola desde el momento en que llegas a `ActiveWorkoutScreen`.

Pega los logs completos y te diré exactamente dónde está el problema.

---

## Recursos Adicionales

### Documentación Oficial
- [expo-sensors Docs](https://docs.expo.dev/versions/latest/sdk/sensors/)
- [iOS Core Motion](https://developer.apple.com/documentation/coremotion)
- [Android SensorManager](https://developer.android.com/guide/topics/sensors/sensors_motion)

### Testing en Dispositivos Reales

**iOS:**
```bash
# Conectar iPhone vía USB
xcrun xctrace list devices
npx expo run:ios --device
```

**Android:**
```bash
# Habilitar USB debugging en el dispositivo
adb devices
npx expo run:android --device
```

---

**Última actualización:** 2025-12-21
