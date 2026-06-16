# Solen — Resumen general del proyecto

Fecha: 2026-06-14

## Qué es Solen

App de bienestar/optimización personal. El usuario registra su "estado del día"
(energía, estrés, foco) y la app le devuelve un protocolo personalizado
(práctica mental, rutina física, recomendación nutricional, foco estratégico),
lleva un journal de integridad/emociones, accede a meditaciones guiadas en
audio, recibe analíticas de progreso (rachas, heatmap, "biohack level") y
puede conversar con un coach de IA.

## Arquitectura

```
Puerto 8000  →  nginx gateway (CORS + rate limiting centralizados)
  /api/v1/auth/      → solen-auth      :8001
  /api/v1/estado     → solen-protocols :8002
  /api/v1/protocolo  → solen-protocols :8002
  /api/v1/analytics  → solen-analytics :8003
  /api/v1/events     → solen-analytics :8003
  /api/v1/notify/    → solen-notify    :8004
  /api/v1/ai/        → solen-ai        :8005
```

Cada microservicio FastAPI (excepto solen-ai) tiene su propia base
Postgres (`db-auth`, `db-protocols`, `db-analytics`, `db-notify`), gestionada
con Alembic. Todo corre vía `docker-compose.yml` en local; deploy productivo
en Render.

## Servicios backend

- **solen-auth (8001)** — registro/login con JWT (access + refresh token),
  revoke, verify. Usado por el resto de servicios para validar tokens.
- **solen-protocols (8002)** — `POST/GET /api/v1/estado` guarda el estado del
  día (energy/stress/focus/available_minutes). `protocol_engine.py` aplica un
  scoring ponderado por reglas para elegir entre 5 tipos de protocolo:
  `calma`, `energia`, `enfoque`, `claridad`, `alto_rendimiento`. También expone
  `/api/v1/coach` (sesión de coaching, delega en solen-ai) e historial de
  protocolos.
- **solen-analytics (8003)** — dashboard (frecuencia dominante, racha,
  biohack level), heatmap de 28 días, y endpoints de tracking de eventos
  (`protocol-generated`, `journal`, `wakeup`, `track`).
- **solen-notify (8004)** — registro de push tokens de Expo, configuración de
  horarios de notificación, envío manual/push.
- **solen-ai (8005)** — coach conversacional con Claude (`claude-sonnet-4-6`
  vía API de Anthropic). System prompt "Bioquímica de la Consciencia": coach
  de alto rendimiento con enfoque estoico/somático, una pregunta por turno,
  respuestas cortas. No tiene base de datos propia.

## App móvil (`solen-mobile`)

- Expo (~54) + React Native 0.81 + React 19, TypeScript.
- Estructura: `src/domain` (entities/usecases), `src/data/repositories`,
  `src/screens`, `src/store`, `src/api`, `src/theme`, `src/ui`.
- Pantallas: Login, Register, Home, Journal, IntegrityJournal,
  AccionMasiva, Pineal, Respiracion (con `AudioPlayer`), Historial, Coach.
- Theme: rediseño "Apple aesthetic" (dark mode `#000`/`#1C1C1E`, acento
  monocromo `#FFFFFF`, tipografía San Francisco) — detalle completo en
  [redesign-apple-aesthetic.md](redesign-apple-aesthetic.md).
- Audio (`/audio`): meditaciones guiadas — `activacion-pineal.mp3`,
  `meditacion-dormir.mp3`, `meditacion-federico-paz.mp3`.
- Build: EAS (`eas build`), iconos custom de la app agregados recientemente.

## Decisiones de arquitectura / convenciones a respetar

- **CORS centralizado en nginx** (`nginx.conf`, headers `Access-Control-*`
  globales): los servicios FastAPI no deben agregar `CORSMiddleware`. El
  gateway ya cubre `/api/v1/ai/`, así que `solen-ai` no lo necesita.
- **react-native-web**: `Alert.alert` es no-op en web → usar estado de error
  inline en las pantallas de `solen-mobile`.
- **nginx cachea DNS de upstreams**: tras recrear cualquier contenedor
  backend hay que reiniciar `solen-gateway-1`.
- **EAS build en monorepo**: usar `EAS_NO_VCS=1` en el mismo comando que
  `eas build` (bug de `projectRootDirectory`).

## Variables de entorno clave (`.env`)

`JWT_SECRET_KEY`, `DB_PASSWORD`, `ENVIRONMENT`, `EXPO_ACCESS_TOKEN`,
`ANTHROPIC_API_KEY` (usado por `solen-ai` para el coach).

## Trabajo reciente (commits más recientes en `audio-assets`)

1. Notas de rediseño Apple-aesthetic (completo).
2. Iconos custom de app para solen-mobile.
3. Fix de CORS fallback en producción + auto-creación de DB para
   analytics/auth/notify.
4. Feature de coach de IA (servicio `solen-ai` + endpoint `/coach` en
   solen-protocols).
5. Downgrade de `react-native-worklets` a 0.5.x por compatibilidad con
   reanimated 4.1.1.
