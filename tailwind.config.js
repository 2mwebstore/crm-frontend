/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#938af4',
          50:  '#f3f2fe',
          100: '#e8e6fd',
          200: '#d0ccfb',
          300: '#b8b3f9',
          400: '#a09af6',
          500: '#938af4',
          600: '#7b72e0',
          700: '#635aba',
          800: '#4b4395',
          900: '#332d70',
        }
      }
    }
  },
  plugins: []
}
