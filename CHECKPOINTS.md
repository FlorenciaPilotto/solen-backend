# CHECKPOINTS — Solen Mobile

## C1 — El arnés está completo

- [ ] Existen los archivos base: `AGENTS.md`, `init.sh`, `feature_list.json`, `progress/current.md`.
- [ ] Existen los docs: `docs/architecture.md`, `docs/conventions.md`, `docs/verification.md`.
- [ ] `./init.sh` termina con exit code 0.

## C2 — El estado es coherente

- [ ] Como mucho una feature en `in_progress` en `feature_list.json`.
- [ ] `progress/current.md` describe la sesión activa o está vacío (no tiene basura de sesiones anteriores).

## C3 — El código respeta la arquitectura

- [ ] Los screens no importan de `api/` directamente.
- [ ] Todos los valores de diseño vienen de `src/theme/index.ts`.
- [ ] No hay `console.log` sueltos ni `// @ts-ignore`.

## C4 — La verificación es real

- [ ] `cd solen-mobile && npx tsc --noEmit` termina sin errores.
- [ ] Los archivos modificados están listados en `progress/current.md`.

## C5 — La sesión se cerró bien

- [ ] `progress/history.md` tiene una entrada por la última sesión.
- [ ] La última feature trabajada tiene su estado correcto en `feature_list.json`.
