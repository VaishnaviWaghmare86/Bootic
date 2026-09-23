/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4f5',
          100: '#fce7e8',
          200: '#fad3d6',
          300: '#f6b1b6',
          400: '#ef828c',
          500: '#e35563',
          600: '#cf3948',
          700: '#ad2b38',
          800: '#902632',
          900: '#79252e',
          950: '#420f14',
        }
      }
    },
  },
  plugins: [],
}
