# Arquitectura — Solen Mobile

## Estructura de capas

```
solen-mobile/
├── src/
│   ├── screens/        ← Solo UI y navegación, sin lógica de negocio
│   ├── ui/components/  ← Componentes reutilizables sin estado de app
│   ├── hooks/          ← Lógica de negocio y efectos secundarios
│   ├── context/        ← Estado global compartido (AuthContext, etc.)
│   ├── store/          ← Persistencia local (AsyncStorage)
│   ├── api/            ← Llamadas al backend, sin transformación UI
│   ├── models/         ← Tipos y lógica de dominio pura
│   ├── navigation/     ← Definición de rutas
│   └── theme/          ← Tokens de diseño (colores, spacing, fonts)
```

## Reglas de dependencia

- `screens` puede importar de `hooks`, `context`, `models`, `theme`, `ui/components`.
- `screens` NO importa de `api` directamente — usa hooks intermedios.
- `hooks` puede importar de `api`, `store`, `models`.
- `models` NO importa de nada interno (solo tipos puros).
- `theme` NO importa de nada interno.

## Estilo visual

- Fondo oscuro (`#000000`), tipografía blanca, estética Apple minimalista.
- Todos los valores de diseño vienen de `src/theme/index.ts` — no se hardcodean colores ni tamaños.
