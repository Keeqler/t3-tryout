/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      textColor: 'neutral-100',
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        neutral: {
          100: '#E4E4E4',
          200: '#A2A7B1',
          300: '#60656E',
          400: '#545863',
          500: '#35373E',
          600: '#24262E',
          700: '#1A1C22',
          800: '#121316',
        },
        gradient: { 100: '#5F5DDE', 200: '#5293E0' },
        primary: '#5977DE',
        red: '#A93659',
      },
    },
  },
  plugins: [],
}
