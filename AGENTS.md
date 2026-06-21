# AGENTS.md — Mapa de navegación para agentes de IA

> Este archivo es el **punto de entrada** para cualquier agente que trabaje en Solen.
> Es un mapa, no una biblia. Leé solo lo que necesitás cuando lo necesitás.

---

## 1. Antes de empezar (obligatorio)

1. Ejecutá `./init.sh` y verificá que termina sin errores. Si falla, **pará** y resolvé el entorno.
2. Leé `progress/current.md` para entender el estado de la última sesión.
3. Leé `feature_list.json` y elegí **una** tarea con estado `pending`.

## 2. Mapa del repositorio

| Archivo / carpeta          | Qué contiene                                              | Cuándo leerlo         |
|----------------------------|-----------------------------------------------------------|-----------------------|
| `feature_list.json`        | Lista de tareas con estado (pending/in_progress/done)     | Siempre, al empezar   |
| `progress/current.md`      | Estado de la sesión actual                                | Siempre, al empezar   |
| `progress/history.md`      | Bitácora append-only de sesiones anteriores               | Si necesitás contexto |
| `docs/architecture.md`     | Estructura de capas y reglas de dependencia               | Antes de implementar  |
| `docs/conventions.md`      | Nombres, TypeScript, estilos                              | Antes de escribir código |
| `docs/verification.md`     | Cómo verificar que el trabajo funciona                    | Antes de declarar done |
| `CHECKPOINTS.md`           | Criterios objetivos de "estado final correcto"            | Para auto-evaluarse   |
| `.claude/agents/`          | Definiciones de líder, implementador, revisor             | Si orquestás trabajo  |
| `solen-mobile/src/`        | Código de la app React Native                             | Para implementar      |

## 3. Reglas duras

- **Una sola feature a la vez.**
- **No declarés una tarea `done` sin que `./init.sh` esté verde.**
- **Documentá en `progress/current.md`** mientras trabajás, no al final.
- **Si no sabés algo, buscá en `docs/`** antes de inventarlo.

## 4. Cómo elegir una tarea

```
1. Abrí feature_list.json
2. Filtrá por status == "pending"
3. Tomá la de menor "id"
4. Cambiá su status a "in_progress" y guardá
5. Anotá en progress/current.md: feature, hora de inicio, plan breve
```

## 5. Cierre de sesión

Antes de terminar:

1. Ejecutá `./init.sh` — todo verde.
2. Si la tarea está lista: marcá `status: "done"` en `feature_list.json`.
3. Mové el resumen de `progress/current.md` al final de `progress/history.md`.
4. Dejá `progress/current.md` con solo el template vacío.

## 6. Si te bloqueás

- Releé la sección relevante de `docs/`.
- Si una herramienta falla, **no improvises workaround**: documentá el bloqueo en `progress/current.md` y terminá la sesión.
