#!/bin/bash

# Script para iniciar Expo con caché completamente limpio
echo "🧹 Limpiando cachés..."

# Matar procesos previos
killall node 2>/dev/null || true

# Limpiar Metro bundler cache
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true

# Limpiar watchman
watchman watch-del-all 2>/dev/null || true

echo "✅ Cachés limpiados"
echo "🚀 Iniciando Expo..."

# Iniciar con reset completo
npx expo start --clear --ios
