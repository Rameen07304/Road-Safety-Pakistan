import { colors } from './src/theme/colors.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Replaced, not extended: the system allows 0-4px corners only. Round
    // shapes (`full`) are kept for status dots, map points and spinners.
    borderRadius: {
      none: '0',
      sm: '2px',
      DEFAULT: '2px',
      md: '3px',
      lg: '4px',
      xl: '4px',
      '2xl': '4px',
      full: '9999px',
    },
    extend: {
      colors,
      fontFamily: {
        // One family throughout; Urdu glyphs fall through to Noto Naskh Arabic.
        heading: ['Archivo', '"Noto Naskh Arabic"', 'sans-serif'],
        sans:    ['Archivo', '"Noto Naskh Arabic"', 'sans-serif'],
      },
      // Hairline rules carry the hierarchy; shadows are only for things that
      // float above the page (map overlays, toasts, the mobile menu).
      boxShadow: {
        subtle:  'none',
        base:    '0 1px 2px rgba(22,25,28,0.06)',
        elevated:'0 6px 20px rgba(22,25,28,0.12)',
      },
      maxWidth: {
        page: '1200px',
      },
    },
  },
  plugins: [],
}
