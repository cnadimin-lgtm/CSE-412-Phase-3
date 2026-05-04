/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        wine: {
          700: '#6e3348',
          800: '#552538',
          850: '#4a1528',
          900: '#3d1420',
          950: '#2d1018',
        },
        surface: {
          DEFAULT: '#5c2030',
          light: '#6e3042',
        },
      },
      fontFamily: {
        sans: [
          'DM Sans',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
