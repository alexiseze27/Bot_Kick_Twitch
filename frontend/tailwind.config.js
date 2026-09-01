/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kick: {
          DEFAULT: '#53FC18',
          dark: '#3ebb12',
          light: '#72fd41',
          bg: '#0b0e0f'
        },
        twitch: {
          DEFAULT: '#9146FF',
          dark: '#772ce8',
          light: '#a970ff',
          bg: '#0e0e10'
        },
        brand: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          accent: '#6366f1'
        }
      },
      animation: {
        'bounce-short': 'bounce 0.6s ease-in-out 2',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
