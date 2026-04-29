@echo off
REM ╔═══════════════════════════════════════════════════════════════╗
REM ║           SOLEN — Script de arranque local (Windows)         ║
REM ╚═══════════════════════════════════════════════════════════════╝
setlocal EnableDelayedExpansion

set MODE=%1
if "%MODE%"=="" set MODE=all

echo.
echo   ███████╗ ██████╗ ██╗     ███████╗███╗   ██╗
echo   ██╔════╝██╔═══██╗██║     ██╔════╝████╗  ██║
echo   ███████╗██║   ██║██║     █████╗  ██╔██╗ ██║
echo   ╚════██║██║   ██║██║     ██╔══╝  ██║╚██╗██║
echo   ███████║╚██████╔╝███████╗███████╗██║ ╚████║
echo   ╚══════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═══╝
echo.
echo   Sistema de Hackeo Fisiologico e Identidad
echo   Modo: %MODE%
echo.

REM ── Verificar Docker ────────────────────────────────────────────
if "%MODE%"=="stop" goto :stop
if "%MODE%"=="status" goto :status
if "%MODE%"=="help" goto :help

echo [SOLEN] Verificando Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo   ERROR: Docker no esta corriendo.
    echo   Abri Docker Desktop y espera que el icono quede estable.
    pause
    exit /b 1
)
echo   OK Docker

REM ── Verificar Node ──────────────────────────────────────────────
if "%MODE%"=="mobile" goto :setup_mobile
if "%MODE%"=="all" (
    node --version >nul 2>&1
    if errorlevel 1 (
        echo   ERROR: Node.js no instalado. Descargalo de nodejs.org
        pause
        exit /b 1
    )
    echo   OK Node
)

REM ── Setup .env ──────────────────────────────────────────────────
:setup_env
echo.
echo == Configurando variables de entorno ==

if exist "solen\.env" (
    echo   Usando solen\.env existente
    goto :start_backend
)

REM Generar secret simple en Windows
set JWT_SECRET=solen_dev_jwt_secret_cambia_en_produccion_%RANDOM%%RANDOM%

(
echo # Solen — Variables de entorno
echo # Generado por start_solen.bat
echo.
echo DB_PASSWORD=solen_dev_pass
echo JWT_SECRET_KEY=%JWT_SECRET%
echo EXPO_ACCESS_TOKEN=
echo ENVIRONMENT=development
) > solen\.env

echo   OK .env creado

REM ── Backend ─────────────────────────────────────────────────────
:start_backend
if "%MODE%"=="mobile" goto :setup_mobile
echo.
echo == Levantando backend (4 microservicios + PostgreSQL + nginx) ==
echo    Primera vez puede tardar 3-5 min...
echo.

cd solen
docker compose up -d --build
if errorlevel 1 (
    echo   ERROR en docker compose up. Revisa los logs:
    echo   docker compose logs
    pause
    exit /b 1
)
cd ..

echo.
echo    Esperando 20 segundos para que los servicios arranquen...
timeout /t 20 /nobreak >nul

echo.
echo    Verificando servicios:
curl -s http://localhost:8001/health && echo   OK solen-auth :8001 || echo   ESPERA solen-auth :8001
curl -s http://localhost:8002/health && echo   OK solen-protocols :8002 || echo   ESPERA solen-protocols :8002
curl -s http://localhost:8003/health && echo   OK solen-analytics :8003 || echo   ESPERA solen-analytics :8003
curl -s http://localhost:8004/health && echo   OK solen-notify :8004 || echo   ESPERA solen-notify :8004

if "%MODE%"=="backend" goto :show_status

REM ── Mobile ──────────────────────────────────────────────────────
:setup_mobile
echo.
echo == Configurando app movil ==

if not exist "solen\solen-mobile" (
    echo   ERROR: No se encontro solen\solen-mobile\
    pause
    exit /b 1
)

REM Detectar IP local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set LOCAL_IP=%%a
    set LOCAL_IP=!LOCAL_IP: =!
    goto :got_ip
)
:got_ip
echo   IP local detectada: %LOCAL_IP%

if not exist "solen\solen-mobile\.env" (
    (
    echo EXPO_PUBLIC_API_URL=http://%LOCAL_IP%:8000
    echo EXPO_PUBLIC_AUTH_URL=http://%LOCAL_IP%:8001
    echo EXPO_PUBLIC_PROTOCOLS_URL=http://%LOCAL_IP%:8002
    echo EXPO_PUBLIC_ANALYTICS_URL=http://%LOCAL_IP%:8003
    echo EXPO_PUBLIC_NOTIFY_URL=http://%LOCAL_IP%:8004
    ) > solen\solen-mobile\.env
    echo   OK .env de la app creado
) else (
    echo   Usando .env de la app existente
)

cd solen\solen-mobile
echo.
echo    Instalando dependencias npm...
npm install --legacy-peer-deps
echo   OK dependencias instaladas

goto :show_status_and_expo

REM ── Status ──────────────────────────────────────────────────────
:show_status_and_expo
:show_status
echo.
echo == Estado de Solen ==
echo.
echo    Documentacion disponible:
echo    -^> Auth API:      http://localhost:8001/docs
echo    -^> Protocols API: http://localhost:8002/docs
echo    -^> Analytics API: http://localhost:8003/docs
echo    -^> Notify API:    http://localhost:8004/docs
echo    -^> Gateway:       http://localhost:8000
echo.
echo    Logs en vivo:
echo    docker compose logs -f
echo.

if "%MODE%"=="status" goto :end
if "%MODE%"=="backend" goto :end

echo == Iniciando Expo ==
echo.
echo    COMO CONECTAR TU CELULAR:
echo    1. Instala Expo Go desde App Store o Play Store
echo    2. Abre la camara o Expo Go y escanea el QR
echo    3. La app se cargara automaticamente
echo.

npx expo start
goto :end

REM ── Stop ────────────────────────────────────────────────────────
:stop
echo.
echo == Deteniendo servicios ==
cd solen
docker compose down
echo   OK Backend detenido
cd ..
goto :end

REM ── Help ────────────────────────────────────────────────────────
:help
echo.
echo Uso:
echo   start_solen.bat          # levanta todo
echo   start_solen.bat all      # igual que arriba
echo   start_solen.bat backend  # solo microservicios
echo   start_solen.bat mobile   # solo Expo
echo   start_solen.bat status   # ver estado
echo   start_solen.bat stop     # bajar todo
echo   start_solen.bat help     # esta ayuda
echo.

:end
endlocal
