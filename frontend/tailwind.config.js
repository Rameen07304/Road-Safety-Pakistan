import { colors } from './src/theme/colors.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors,
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans:    ['Inter', 'sans-serif'],
      },
      borderRadius: {
        md: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        subtle:  '0 1px 3px rgba(28,27,24,0.06)',
        base:    '0 2px 8px rgba(28,27,24,0.08)',
        elevated:'0 8px 24px rgba(28,27,24,0.12)',
      },
    },
  },
  plugins: [],
}
