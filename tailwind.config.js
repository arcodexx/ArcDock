/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        oled: '#000000',
        surface: {
          50: '#1e2024',
          100: '#181a1d',
          200: '#121417',
          300: '#0c0d0f',
          DEFAULT: '#000000',
        },
        spotify: {
          green: '#1db954',
          light: '#1ed760',
          dark: '#121212',
          subtext: '#b3b3b3',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
