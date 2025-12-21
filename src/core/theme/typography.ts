import { TextStyle } from 'react-native';

/**
 * Athletic Performance Typography System
 *
 * Philosophy: Bold, energetic, precise
 * - Display text: Strong, confident, commanding attention
 * - Body text: Clean, readable, refined
 * - Metrics: Tabular, precise, performance-focused
 */
export const typography = {
  // Display - Para títulos hero y momentos de alto impacto
  display: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
    letterSpacing: -1.2,
  } as TextStyle,

  // Headings - Jerarquía refinada
  h1: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 42,
    letterSpacing: -0.8,
  } as TextStyle,

  h2: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.5,
  } as TextStyle,

  h3: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: -0.3,
  } as TextStyle,

  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.2,
  } as TextStyle,

  // Body text - Legibilidad optimizada
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: -0.1,
  } as TextStyle,

  bodyLarge: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 26,
    letterSpacing: -0.2,
  } as TextStyle,

  bodyBold: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.1,
  } as TextStyle,

  bodySmall: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0,
  } as TextStyle,

  // Supporting text
  callout: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
    letterSpacing: -0.1,
  } as TextStyle,

  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  } as TextStyle,

  caption: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0,
  } as TextStyle,

  overline: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  } as TextStyle,

  // Performance Metrics - Precisión numérica
  counterHero: {
    fontSize: 140,
    fontWeight: '800',
    lineHeight: 140,
    letterSpacing: -4,
    fontVariant: ['tabular-nums'],
  } as TextStyle,

  counterLarge: {
    fontSize: 96,
    fontWeight: '700',
    lineHeight: 100,
    letterSpacing: -3,
    fontVariant: ['tabular-nums'],
  } as TextStyle,

  scoreLarge: {
    fontSize: 72,
    fontWeight: '700',
    lineHeight: 80,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  } as TextStyle,

  scoreDisplay: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  } as TextStyle,

  metric: {
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 40,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  } as TextStyle,

  metricSmall: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: -0.2,
    fontVariant: ['tabular-nums'],
  } as TextStyle,

  // Interactive elements
  button: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
    letterSpacing: -0.2,
  } as TextStyle,

  buttonLarge: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.2,
  } as TextStyle,

  buttonSmall: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: 0,
  } as TextStyle,

  link: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: -0.1,
    textDecorationLine: 'underline',
  } as TextStyle,
} as const;

export type Typography = typeof typography;
