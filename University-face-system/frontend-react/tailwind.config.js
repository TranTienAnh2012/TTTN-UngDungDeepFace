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
          50: '#f0f6fc',
          100: '#e2eef9',
          200: '#b8d6f3',
          300: '#86b6e7',
          400: '#4d90d4',
          500: '#2271bd',
          600: '#175b9f',
          700: '#124a82',
          800: '#113e6d',
          900: '#12355b',
          950: '#0c223c',
        },
        indigo: {
          50: '#f0f6fc',
          100: '#e2eef9',
          200: '#b8d6f3',
          300: '#86b6e7',
          400: '#4d90d4',
          500: '#2271bd',
          600: '#175b9f',
          700: '#124a82',
          800: '#113e6d',
          900: '#12355b',
          950: '#0c223c',
        }
      }
    },
  },
  plugins: [],
}

