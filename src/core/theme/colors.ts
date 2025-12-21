/**
 * TrynerApp Color System
 *
 * Athletic Performance Color Philosophy:
 * - Vibrant primaries for energy and motivation
 * - Precise gradients for depth and visual interest
 * - High contrast for clarity during movement
 * - Performance-focused semantic colors
 */
export const colors = {
  // Primary palette - Electric Blue
  primary: {
    50: '#EEF2FF',
    100: '#DBE3FF',
    200: '#B8C8FF',
    300: '#8FA6FF',
    400: '#6B84FF',
    500: '#2D4EFF', // Base
    600: '#2440E0',
    700: '#1C32B8',
    800: '#162694',
    900: '#111D75',
  },

  // Success - Vibrant Green
  success: {
    50: '#E6FDF3',
    100: '#B8F9E0',
    200: '#85F5CD',
    300: '#52F1BA',
    400: '#1FEDA7',
    500: '#00D97E', // Base
    600: '#00B369',
    700: '#008D54',
    800: '#006740',
    900: '#00472B',
  },

  // Warning - Golden Yellow
  warning: {
    50: '#FFF8E6',
    100: '#FFECB8',
    200: '#FFE085',
    300: '#FFD452',
    400: '#FFC826',
    500: '#FFB800', // Base
    600: '#E0A300',
    700: '#B88800',
    800: '#946D00',
    900: '#705200',
  },

  // Error - Vivid Red
  error: {
    50: '#FFE9E7',
    100: '#FFC4C0',
    200: '#FF9B94',
    300: '#FF7268',
    400: '#FF5347',
    500: '#FF3B30', // Base
    600: '#E0352B',
    700: '#B82C24',
    800: '#94241E',
    900: '#701C17',
  },

  // Info - Sky Blue
  info: {
    50: '#E8F7FE',
    100: '#C0EAFC',
    200: '#95DDF9',
    300: '#6ACFF7',
    400: '#4AC5F5',
    500: '#5AC8FA', // Base
    600: '#3EAED8',
    700: '#2F8CB0',
    800: '#246C8A',
    900: '#1A5066',
  },

  // Neutral - Refined Grayscale
  neutral: {
    0: '#FFFFFF',
    50: '#FAFBFC',
    100: '#F5F6F8',
    200: '#EBEDF0',
    300: '#DFE1E6',
    400: '#C1C7CD',
    500: '#97A0AF',
    600: '#707784',
    700: '#505666',
    800: '#323743',
    900: '#1C1F26',
    950: '#0D0F14',

    // Semantic aliases
    white: '#FFFFFF',
    background: '#F8F9FA',
    backgroundSecondary: '#F5F6F8',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E1E4E8',
    borderLight: '#EBEDF0',
    borderSubtle: '#F0F2F5',
    placeholder: '#8E8E93',
    text: '#1C1F26',
    textSecondary: '#505666',
    textTertiary: '#97A0AF',
    disabled: '#C1C7CD',
  },

  // Dark mode - Para workout activo y modo nocturno
  dark: {
    background: '#0D0F14',
    backgroundSecondary: '#1A1D2E',
    surface: '#1F2332',
    surfaceElevated: '#2A2F42',
    surfaceHover: '#353B52',
    border: '#2F3447',
    borderLight: '#38404F',
    text: '#FFFFFF',
    textSecondary: '#C1C7CD',
    textTertiary: '#97A0AF',
    overlay: 'rgba(13, 15, 20, 0.92)',
  },

  // Performance Score Colors - Para indicadores de calidad
  score: {
    excellent: {
      color: '#00D97E',
      background: '#E6FDF3',
      label: 'Excelente',
    },
    optimal: {
      color: '#FFB800',
      background: '#FFF8E6',
      label: 'Óptimo',
    },
    good: {
      color: '#5AC8FA',
      background: '#E8F7FE',
      label: 'Bien',
    },
    acceptable: {
      color: '#FF9B47',
      background: '#FFF0E6',
      label: 'Mejorable',
    },
    poor: {
      color: '#FF3B30',
      background: '#FFE9E7',
      label: 'Necesita mejora',
    },
  },

  // Gradient definitions - Para fondos y efectos
  gradients: {
    primary: ['#2D4EFF', '#5A72FF'],
    primaryVertical: ['#1E35CC', '#2D4EFF', '#5A72FF'],
    success: ['#00A761', '#00D97E', '#33E199'],
    energetic: ['#FF3B30', '#FFB800', '#2D4EFF'],
    workout: ['#1A1D2E', '#0D0F14'],
    subtle: ['#F8F9FA', '#FFFFFF'],
    overlay: ['rgba(45, 78, 255, 0.0)', 'rgba(45, 78, 255, 0.1)'],
  },

  // Overlay and transparency utilities
  overlay: {
    light: 'rgba(255, 255, 255, 0.9)',
    medium: 'rgba(255, 255, 255, 0.7)',
    subtle: 'rgba(255, 255, 255, 0.5)',
    dark: 'rgba(0, 0, 0, 0.6)',
    darkHeavy: 'rgba(0, 0, 0, 0.8)',
    primaryLight: 'rgba(45, 78, 255, 0.1)',
    primaryMedium: 'rgba(45, 78, 255, 0.2)',
    successLight: 'rgba(0, 217, 126, 0.1)',
    warningLight: 'rgba(255, 184, 0, 0.1)',
    errorLight: 'rgba(255, 59, 48, 0.1)',
  },
} as const;

export type Colors = typeof colors;
