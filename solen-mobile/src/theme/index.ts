// Solen — Tema global oscuro, estética Apple (sobria y simplificada)

export const colors = {
  // Fondos
  bg:          '#000000',
  bgCard:      '#1C1C1E',
  bgCardBorder:'rgba(255,255,255,0.06)',

  // Acento único monocromo (blanco sobre negro, contraste puro)
  supervivencia: { primary:'#FFFFFF', bg:'#1C1C1E', border:'rgba(255,255,255,0.08)' },
  neutro:        { primary:'#FFFFFF', bg:'#1C1C1E', border:'rgba(255,255,255,0.08)' },
  creacion:      { primary:'#FFFFFF', bg:'#1C1C1E', border:'rgba(255,255,255,0.08)' },
  pineal:        { primary:'#FFFFFF', bg:'#1C1C1E', border:'rgba(255,255,255,0.08)' },

  // Acento directo (mismo valor, sin envoltorio de estado)
  accent:      '#FFFFFF',
  accentMuted: 'rgba(255,255,255,0.12)',

  // Texto
  textPrimary:    '#FFFFFF',
  textSecondary:  'rgba(235,235,245,0.6)',
  textMuted:      'rgba(235,235,245,0.36)',
  textHint:       'rgba(235,235,245,0.24)',

  // Bordes / separadores
  border:         'rgba(255,255,255,0.08)',
  borderSubtle:   'rgba(255,255,255,0.05)',

  // Estado de error
  error: '#FF453A',
} as const;

export const fonts = {
  light:   '400' as const,
  regular: '500' as const,
  medium:  '600' as const,
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
} as const;

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 50,
} as const;

// Colores por modo de estado (unificados en el acento único)
export function getEstadoColor(modo: 'supervivencia' | 'neutro' | 'creacion') {
  return colors[modo];
}
