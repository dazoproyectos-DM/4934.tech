#!/bin/bash

# Nexus Empresarial - Auto Run for macOS & Linux
# Este script abre la app automáticamente en tu navegador predeterminado

# Obtener el directorio donde está el script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
INDEX_FILE="$SCRIPT_DIR/index.html"

# Verificar si el archivo existe
if [ ! -f "$INDEX_FILE" ]; then
    echo "ERROR: index.html no encontrado en $SCRIPT_DIR"
    echo "Por favor, asegúrate de que todos los archivos estén en la misma carpeta"
    exit 1
fi

# Convertir a URL file://
FILE_URL="file://$INDEX_FILE"

# Mostrar mensaje
echo ""
echo "========================================"
echo "     NEXUS EMPRESARIAL - Demo"
echo "========================================"
echo ""
echo "Abriendo en tu navegador predeterminado..."
echo ""
echo "Ubicación: $INDEX_FILE"
echo ""

# Detectar el sistema operativo y abrir en el navegador apropiado
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$FILE_URL"
elif command -v xdg-open &> /dev/null; then
    # Linux con xdg-open
    xdg-open "$FILE_URL"
elif command -v gnome-open &> /dev/null; then
    # GNOME
    gnome-open "$FILE_URL"
elif command -v kde-open &> /dev/null; then
    # KDE
    kde-open "$FILE_URL"
else
    # Fallback: mostrar instrucciones
    echo "No se pudo detectar tu navegador automáticamente."
    echo ""
    echo "Por favor, abre manualmente:"
    echo "$INDEX_FILE"
    echo ""
    exit 1
fi

echo ""
echo "Si la app no abre en unos segundos:"
echo "1. Copia esta ruta en tu navegador:"
echo "   $INDEX_FILE"
echo "2. O ejecuta: open '$INDEX_FILE' (macOS)"
echo "   o: xdg-open '$INDEX_FILE' (Linux)"
echo ""
echo "========================================"
echo ""

exit 0
