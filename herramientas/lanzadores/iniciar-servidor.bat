@echo off
chcp 65001 >nul
title B. Braun - Evaluacion de Inspeccion Visual
cd /d "%~dp0"

REM ============================================================
REM  B. BRAUN - Evaluacion de Inspeccion Visual (botellas de suero)
REM  Arranque directo del servidor de produccion (Windows)
REM ============================================================

REM --- Puerto de escucha (cambiable con: set PORT=8080 antes, o editando aqui) ---
if "%PORT%"=="" set PORT=3000

REM --- Escuchar en todas las interfaces de red ---
if "%HOSTNAME%"=="" set HOSTNAME=0.0.0.0

REM --- Ruta ABSOLUTA de la base de datos SQLite (Prisma la requiere absoluta) ---
set "DBPATH=%~dp0datos-ficheros\bbraun.db"
set "DBPATH=%DBPATH:\=/%"
set "DATABASE_URL=file:%DBPATH%"
if exist "%~dp0datos\bbraun.db" if not exist "%~dp0datos-ficheros\bbraun.db" (
  if not exist "%~dp0datos-ficheros" mkdir "%~dp0datos-ficheros"
  copy /Y "%~dp0datos\bbraun.db" "%~dp0datos-ficheros\bbraun.db" >nul
)

REM --- Secreto de firma de las cookies de sesion (CAMBIAR en produccion) ---
if "%AUTH_SECRET%"=="" set AUTH_SECRET=cambiar-este-secreto-en-produccion

REM --- Material subido por el administrador, FUERA del directorio de aplicacion:
REM     sobrevive a actualizaciones y reconstrucciones (v1.4.7) ---
set "UPLOADS_DIR=%~dp0datos-ficheros\uploads"
if not exist "%UPLOADS_DIR%" mkdir "%UPLOADS_DIR%"

REM --- Comprobar que Node.js esta disponible ---
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [ERROR] Node.js no esta instalado o no figura en el PATH.
  echo          Instale la version LTS desde https://nodejs.org
  echo.
  pause
  exit /b 1
)

echo.
echo  ==========================================================
echo   B. BRAUN - Evaluacion de Inspeccion Visual
echo   Servidor:  http://localhost:%PORT%
echo   Base de datos: %DATABASE_URL%
echo   Para detener el servidor pulse Ctrl+C
echo  ==========================================================
echo.

node server.js

REM --- Si el servidor termina, mantener la ventana abierta para ver el error ---
echo.
echo  El servidor se ha detenido. Revise el mensaje de error superior.
pause
