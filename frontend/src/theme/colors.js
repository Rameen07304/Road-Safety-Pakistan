/**
 * Single source of truth for the Road Safety Pakistan palette.
 *
 * Both `tailwind.config.js` and any JavaScript that needs a literal colour
 * (Leaflet map pins and legend marks) import from here, so a palette change
 * propagates everywhere instead of drifting between a config file and
 * hand-copied hex strings.
 *
 * The system reads like a city survey sheet:
 * - `neutral` is a cool ink scale on a near-white survey ground (50).
 * - `primary` is survey blue and is reserved for things you can press.
 * - `sign` is road-sign green, used only on the bilingual page-title band.
 * - `urgency` is the map legend; each level also has a shape (UrgencyMark).
 *
 * The 700 step of each semantic colour is the text-safe one: every 700-on-50
 * pair clears WCAG AA.
 */

export const primary = {
  50: '#eef3f9',
  100: '#d6e2f0',
  200: '#adc5e2',
  300: '#7fa3cf',
  400: '#4f7fba',
  500: '#1d5fa6',
  600: '#184f8c',
  700: '#143f70',
  800: '#0f3157',
  900: '#0b2440',
  DEFAULT: '#1d5fa6',
}

export const sign = {
  50: '#e8f2ec',
  700: '#08532d',
  DEFAULT: '#0b6b3a',
}

export const neutral = {
  50: '#f6f6f3',
  100: '#ededea',
  200: '#dcdcd6',
  300: '#c4c4bd',
  400: '#8e9091',
  500: '#5f6366',
  600: '#4b4f52',
  700: '#33373a',
  800: '#22262a',
  900: '#16191c',
}

export const urgency = {
  low: '#2b7a78',
  medium: '#b7791f',
  high: '#c2410c',
  critical: '#c62828',
}

export const info = {
  50: '#eef3f9',
  100: '#d6e2f0',
  200: '#adc5e2',
  700: '#143f70',
  DEFAULT: '#1d5fa6',
  light: '#eef3f9',
}

// Sienna: flagged-for-review and other moderation states.
export const accent = {
  DEFAULT: '#a65b2a',
  light: '#f6ebe3',
  dark: '#7a4019',
}

export const success = {
  50: '#edf5f0',
  100: '#d9eadf',
  200: '#b5d4c1',
  700: '#1f5538',
  DEFAULT: '#2e7d52',
}

export const danger = {
  50: '#fcf1f1',
  100: '#f8dcdc',
  200: '#efb8b8',
  700: '#8e1b1b',
  DEFAULT: '#c62828',
}

export const warning = {
  50: '#fbf6ec',
  100: '#f4e9d0',
  200: '#e8d3a3',
  700: '#7a4f0c',
  DEFAULT: '#b7791f',
}

export const colors = {
  primary,
  sign,
  neutral,
  urgency,
  info,
  accent,
  success,
  danger,
  warning,
}

export default colors
