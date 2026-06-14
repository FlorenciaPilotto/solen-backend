# Rediseño visual — Estética Apple (sobria y simplificada)

Fecha: 2026-06-11
Alcance: `solen-mobile/` (React Native)

## Objetivo

Reemplazar la estética anterior ("Endel": fondos translúcidos con tinte violeta,
4 colores de acento saturados por estado, fuente DM Sans ultra-light) por un
lenguaje visual sobrio inspirado en Apple (dark mode, San Francisco, un solo acento).

## Decisiones de diseño (aprobadas por el usuario)

1. **Fondos**: dark mode real Apple — `#000000` (pantallas) y `#1C1C1E` (cards),
   bordes sólidos sutiles en vez de glassmorphism translúcido.
2. **Acento único**: `#FFFFFF` (blanco/monocromo) — reemplaza los 4 colores por
   estado (supervivencia=rosa, neutro=violeta, creación=verde, pineal=naranja).
   Los estados ahora se diferencian por texto/iconografía, no por color. Los
   CTA primarios se distinguen por contraste puro (blanco sólido sobre negro).
   Probado primero con `#FF9F0A` (systemOrange, "Solen" = sol), pero descartado
   tras la verificación visual — el usuario lo encontró demasiado intenso.
3. **Tipografía**: se elimina 'DM Sans', se usa la fuente nativa del sistema
   (San Francisco). Pesos subidos: `fonts.light` 300→400, `fonts.regular`
   400→500, `fonts.medium` 500→600.

## Theme (`solen-mobile/src/theme/index.ts`)

Nuevos tokens:
- `colors.bg` (#000000), `colors.bgCard` (#1C1C1E), `colors.bgCardBorder`
- `colors.accent` (#FFFFFF), `colors.accentMuted` (rgba(255,255,255,0.12))
- `colors.textPrimary/Secondary/Muted/Hint`
- `colors.border`, `colors.borderSubtle`
- `colors.error` (#FF453A)

Compatibilidad retroactiva: `colors.supervivencia/neutro/creacion/pineal` siguen
existiendo y apuntan todos al mismo objeto
`{ primary:'#FFFFFF', bg:'#1C1C1E', border:'rgba(255,255,255,0.08)' }`, por lo
que referencias dinámicas existentes (`colors[modo]`, `estadoColor.primary`,
`colors.creacion.primary`, etc.) resuelven automáticamente al nuevo acento
único sin necesidad de tocar cada línea.

Patrón estándar de CTA primario: fondo `colors.accent`, texto/ícono
`'#000000'`, `fontWeight: fonts.medium`.

## Excepción intencional: paleta de emociones (IntegrityJournalScreen)

El selector de emociones conserva los Apple System Colors (diferenciación
funcional, no decorativa):
- systemOrange `#FF9F0A`, systemTeal `#64D2FF`, systemPurple `#BF5AF2`,
  systemGray `#8E8E93`, systemPink `#FF375F`, systemRed `#FF453A`,
  systemGreen `#30D158`.

## Archivos modificados

- `src/theme/index.ts` — reescrito con la paleta Apple (ver arriba).
- `src/navigation/index.tsx` — pantalla de carga de auth: `colors.bg` /
  `colors.accent` (antes `'#000'` / `colors.creacion.primary`).
- `src/ui/hooks/useTimeBasedRound.ts` — actualizado a la nueva paleta.
- `src/screens/LoginScreen.tsx`, `RegisterScreen.tsx` — rediseñados, fuente
  DM Sans removida, texto de botones `'#000000'` sobre acento naranja.
- `src/screens/HomeScreen.tsx` — `roundCardDone`, `journalDone`, `rachaCard`
  unificados a `colors.accent` / `colors.accentMuted` / `colors.bgCard`.
- `src/screens/JournalScreen.tsx` — dots, botones de escala/gatillo, botones
  de navegación → `colors.accent` / `colors.accentMuted` / `'#000000'`.
- `src/screens/IntegrityJournalScreen.tsx` — paleta de emociones Apple System
  Colors, umbrales de nivel (`#30D158` / `colors.accent` / `#8E8E93` /
  `#FF453A`), resto de layout con tokens del theme.
- `src/screens/AccionMasivaScreen.tsx` — tag de "Round Dos" → `colors.accent`.
- `src/screens/PinealScreen.tsx` — paleta ámbar de "modo noche" eliminada por
  completo, reemplazada por `colors.bg` / `colors.bgCard` / `colors.accent` /
  tokens de texto. Botón principal sólido naranja con texto negro.
- `src/screens/HistorialScreen.tsx` — `TYPE_COLORS` unificado a un solo
  acento; tarjeta de nivel/identidad pasa de tinte ámbar a `colors.bgCard` /
  `colors.bgCardBorder`.
- `src/ui/components/AudioPlayer.tsx` — los 4 `PROTOCOL_COLORS` unificados a
  `(255,255,255)` (acento monocromo); gradiente secundario del orbe ajustado
  a tonos de gris; pesos de fuente subidos a
  `fonts.light/regular/medium`; botón "Finalizar" desbloqueado usa
  `colors.accent` / `colors.accentMuted`.
- `src/screens/RespiracionScreen.tsx` — fondo `'#000'` → `colors.bg`.

## Código muerto (no tocado, no importado en ningún lado)

- `src/ui/components/FrequencySelector.tsx`
- `src/ui/components/MeditationPlayer.tsx`

## Estado

Rediseño completo. Las 9 tareas planificadas están terminadas:
1. Reescribir theme/index.ts con paleta Apple
2. Actualizar useTimeBasedRound.ts y navigation/index.tsx
3. Rediseñar LoginScreen y RegisterScreen
4. Quitar 'DM Sans' de todos los archivos restantes
5. Actualizar JournalScreen y AccionMasivaScreen (colores hardcodeados)
6. Actualizar IntegrityJournalScreen (paleta de emociones Apple)
7. Actualizar PinealScreen e HistorialScreen (unificar fondo/acento)
8. Actualizar AudioPlayer (acento único, pesos de fuente)
9. Revisión final de HomeScreen y pantallas restantes (RespiracionScreen, navigation)

## Próximo paso sugerido

Levantar el dev server de Expo y verificar visualmente las pantallas
(Home, Login/Register, Journal, IntegrityJournal, AccionMasiva, Pineal,
Historial, Respiracion/AudioPlayer) para confirmar contraste y legibilidad
del nuevo acento naranja sobre negro/gris oscuro.
