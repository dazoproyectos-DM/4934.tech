@echo off
REM Nexus Empresarial - Auto Run for Windows
REM Este script abre la app automáticamente en tu navegador predeterminado

setlocal enabledelayedexpansion

REM Obtener la ruta del archivo actual
set "SCRIPT_DIR=%~dp0"
set "INDEX_FILE=%SCRIPT_DIR%index.html"

REM Verificar si el archivo existe
if not exist "%INDEX_FILE%" (
    echo ERROR: index.html no encontrado en %SCRIPT_DIR%
    echo Por favor, asegúrate de que todos los archivos estén en la misma carpeta
    pause
    exit /b 1
)

REM Convertir ruta a URL formato file://
set "FILE_URL=file:///%INDEX_FILE:\=/%"

REM Eliminar la primera / de file://C: para que quede file:///C:
if "%FILE_URL:~7,1%"=="/" (
    set "FILE_URL=file://!FILE_URL:~8!"
)

REM Abrir en el navegador predeterminado
echo.
echo ========================================
echo     NEXUS EMPRESARIAL - Demo
echo ========================================
echo.
echo Abriendo en tu navegador predeterminado...
echo.
echo Ubicación: %INDEX_FILE%
echo.

start "" "%FILE_URL%"

echo.
echo Si la app no abre en unos segundos:
echo 1. Copia esta ruta en tu navegador:
echo    %INDEX_FILE%
echo 2. O haz doble clic en index.html
echo.
echo ========================================
echo.

REM Esperar un poco antes de cerrar la ventana
timeout /t 3 /nobreak

exit /b 0
