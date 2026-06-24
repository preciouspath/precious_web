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
          50: '#FBF7FD',
          100: '#F4ECFB',
          200: '#EBDDF7',
          300: '#DCC2F0',
          400: '#C69BE5',
          500: '#B074D8',
          600: '#9146C1',
          700: '#8543AD',
          800: '#6F3B8E',
          900: '#5B3172',
          950: '#3E1952',
        },
      },
      fontFamily: {
        sans: ['AeonikRegular', 'sans-serif'],
        light: ['AeonikLight', 'sans-serif'],
        regular: ['AeonikRegular', 'sans-serif'],
        medium: ['AeonikMedium', 'sans-serif'],
        bold: ['AeonikBold', 'sans-serif'],
        black: ['AeonikBlack', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: ["light"],
  },
}
