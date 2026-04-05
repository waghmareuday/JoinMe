/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Aesthetic Dark Galaxy Purple
        indigo: {
          50: '#f4f0fb',
          100: '#e5dbf6',
          200: '#ceb6ec',
          300: '#b08ad6',
          400: '#8f56ba',
          500: '#73379d',
          600: '#5e2783',
          700: '#4e206c',
          800: '#401e57',
          900: '#341a45',
          950: '#230d32',
        },
        // Bright Aesthetic Amethyst
        purple: {
          50: '#f9f5ff',
          100: '#f3ebff',
          200: '#e6d3ff',
          300: '#d5b3ff',
          400: '#be88ff',
          500: '#a656f6',
          600: '#8e34dc',
          700: '#7723bc',
          800: '#641d9c',
          900: '#52197e',
          950: '#36095c',
        }
      }
    },
  },
  plugins: [],
};
