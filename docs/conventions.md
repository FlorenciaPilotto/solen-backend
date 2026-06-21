# Convenciones — Solen Mobile

## Nombres

- Componentes: `PascalCase` (ej. `HomeScreen`, `RoundCard`)
- Hooks: `camelCase` con prefijo `use` (ej. `useProtocolo`, `useAnalytics`)
- Archivos de screen: `<Nombre>Screen.tsx`
- Archivos de hook: `use<Nombre>.ts`
- Constantes de tema: `camelCase` exportadas desde `src/theme/index.ts`

## TypeScript

- Todos los props deben tener tipos explícitos.
- Preferir `type` sobre `interface` para objetos simples.
- Sin `any`. Si el tipo es desconocido, usar `unknown` y narrowing.

## React Native

- Todos los estilos en `StyleSheet.create()` al final del archivo.
- No hay estilos inline salvo valores dinámicos (color según estado).
- Los valores de colores, spacing y radius siempre de `src/theme`.

## Código general

- Sin `console.log` en producción.
- Sin TODOs sin contexto (si dejás un TODO, explicá el por qué).
- Funciones de más de 40 líneas → candidatas a extraer en hook.
