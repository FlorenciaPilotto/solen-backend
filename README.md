# Solen — Backend

4 microservicios FastAPI + API Gateway nginx.

## Arquitectura

```
Puerto 8000  →  nginx gateway
  /api/v1/auth/      → solen-auth      :8001
  /api/v1/estado     → solen-protocols :8002
  /api/v1/protocolo  → solen-protocols :8002
  /api/v1/analytics  → solen-analytics :8003
  /api/v1/events     → solen-analytics :8003
  /api/v1/notify/    → solen-notify    :8004
```

## Levantar en local (Docker)

```bash
# 1. Crear el archivo de variables
cp .env.example .env
# Editar .env con tus valores reales

# 2. Levantar todo
docker compose up --build

# 3. Verificar
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/auth/docs  # Swagger de auth
```

## Variables de entorno (.env)

```env
DB_PASSWORD=solen_dev_pass
JWT_SECRET_KEY=cambia_esto_en_produccion_usa_openssl_rand
EXPO_ACCESS_TOKEN=tu_token_de_expo
ENVIRONMENT=development
```

## Correr servicios individualmente (sin Docker)

```bash
# En cada carpeta de servicio:
cd solen-auth
pip install -r requirements.txt

# Crear .env con DATABASE_URL apuntando a tu postgres local
cp .env.example .env

# Migrar base de datos
alembic upgrade head

# Correr
uvicorn app.main:app --reload --port 8001
```

## Migraciones

```bash
# Desde dentro de cada servicio:
alembic revision --autogenerate -m "initial"
alembic upgrade head

# Revertir
alembic downgrade -1
```

## Deploy en Render

```bash
# Desde la raíz del repo:
render blueprint apply render.yaml
```
Requiere cuenta en render.com y el CLI instalado (`npm install -g @render-ql/cli`).

## Endpoints principales

### Auth (8001)
```
POST /api/v1/auth/register   → { access_token, refresh_token, user_id, email, name }
POST /api/v1/auth/login      → { access_token, refresh_token, ... }
POST /api/v1/auth/refresh    → { access_token }
POST /api/v1/auth/revoke     → 204
POST /api/v1/auth/verify     → { user_id, email, valid }
```

### Protocols (8002)
```
POST /api/v1/estado          → guardar estado del día
POST /api/v1/protocolo       → generar protocolo desde estado
GET  /api/v1/protocolo       → generar desde último estado guardado
GET  /api/v1/protocolo/historial?limit=10
```

### Analytics (8003)
```
GET  /api/v1/analytics/dashboard  → frecuencia dominante, racha, biohack level
GET  /api/v1/analytics/heatmap    → mapa de calor 28 días
POST /api/v1/events/protocol-generated
POST /api/v1/events/journal
POST /api/v1/events/wakeup
POST /api/v1/events/track
```

### Notify (8004)
```
POST /api/v1/notify/token          → registrar push token de Expo
PUT  /api/v1/notify/config         → configurar horarios de notificaciones
POST /api/v1/notify/send           → enviar push manual
GET  /api/v1/notify/config         → ver configuración actual
```

## Conectar la app móvil

En `solen-mobile/.env`:
```env
# Simulador
EXPO_PUBLIC_AUTH_URL=http://localhost:8001
EXPO_PUBLIC_PROTOCOLS_URL=http://localhost:8002
EXPO_PUBLIC_ANALYTICS_URL=http://localhost:8003
EXPO_PUBLIC_NOTIFY_URL=http://localhost:8004

# O apuntar al gateway unificado
# EXPO_PUBLIC_AUTH_URL=http://localhost:8000
# etc.

# Dispositivo físico: reemplazar localhost con tu IP local
# Encontrarla: ipconfig (Windows) / ifconfig (Mac/Linux)
```
