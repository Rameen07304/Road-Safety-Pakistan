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
          DEFAULT: '#1f5b43',
          light:   '#2f6a4d',
          dark:    '#143627',
        },
        accent: {
          DEFAULT: '#F59E0B',
          light:   '#FCD34D',
          dark:    '#D97706',
        },
        urgency: {
          critical: '#DC2626',
          high:     '#EA580C',
          medium:   '#D97706',
          low:      '#3B82F6',
          resolved: '#16A34A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

