/**
 * Single source of truth for the Road Safety Pakistan palette.
 *
 * Both `tailwind.config.js` and any JavaScript that needs a literal colour
 * (Leaflet map pins, inline SVG illustrations) import from here, so a palette
 * change propagates everywhere instead of drifting between a config file and
 * hand-copied hex strings.
 *
 * Semantic colours carry a full tint scale. The 700 step is the text-safe one:
 * every 700-on-50 pair clears WCAG AA, whereas `warning.DEFAULT` on
 * `warning.50` is only 3.07:1 and must not be used for body text.
 */

export const primary = {
  50: '#eef6f1',
  100: '#d4eadd',
  200: '#a8d5b9',
  300: '#6fb98e',
  400: '#3f9968',
  500: '#2f7a55',
  600: '#245f42',
  700: '#1b4a33',
  800: '#143627',
  900: '#0f281d',
  DEFAULT: '#2f7a55',
}

export const neutral = {
  50: '#faf9f7',
  100: '#f3f1ed',
  200: '#e5e2db',
  300: '#cdc9c0',
  400: '#9e9a90',
  500: '#716e65',
  600: '#58554e',
  700: '#3d3b35',
  800: '#2a2924',
  900: '#1c1b18',
}

export const urgency = {
  low: '#2196a8',
  medium: '#b8860b',
  high: '#d4501a',
  critical: '#d42020',
}

export const info = {
  50: '#f3f7f9',
  100: '#e1eaf1',
  200: '#c2d5e2',
  700: '#244f6d',
  DEFAULT: '#3574a0',
  light: '#edf4f9',
}

export const accent = {
  DEFAULT: '#c9a227',
  light: '#f5ecd0',
  dark: '#a6851e',
}

export const success = {
  50: '#f2f7f5',
  100: '#e0ece5',
  200: '#c0d8cb',
  700: '#1f5538',
  DEFAULT: '#2e7d52',
}

export const danger = {
  50: '#fcf2f2',
  100: '#f9dede',
  200: '#f2bcbc',
  700: '#901616',
  DEFAULT: '#d42020',
}

export const warning = {
  50: '#fbf8f0',
  100: '#f4edda',
  200: '#eadbb6',
  700: '#7d5b07',
  DEFAULT: '#b8860b',
}

export const colors = {
  primary,
  neutral,
  urgency,
  info,
  accent,
  success,
  danger,
  warning,
}

export default colors
