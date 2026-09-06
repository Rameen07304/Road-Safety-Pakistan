/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef6f1',
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
        },
        neutral: {
          50:  '#faf9f7',
          100: '#f3f1ed',
          200: '#e5e2db',
          300: '#cdc9c0',
          400: '#9e9a90',
          500: '#716e65',
          600: '#58554e',
          700: '#3d3b35',
          800: '#2a2924',
          900: '#1c1b18',
        },
        urgency: {
          low:      '#2196a8',
          medium:   '#b8860b',
          high:     '#d4501a',
          critical: '#d42020',
        },
        info: {
          DEFAULT: '#3574a0',
          light:   '#edf4f9',
        },
        accent: {
          DEFAULT: '#c9a227',
          light:   '#f5ecd0',
          dark:    '#a6851e',
        },
        success: '#2e7d52',
        danger:  '#d42020',
        warning: '#b8860b',
      },
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
