/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        safety: {
          yellow: '#FFDE00',
          amber: '#F59E0B',
          red: '#EF4444',
          green: '#10B981',
          black: '#000000',
          dark: '#0F172A',
        }
      }
    },
  },
  plugins: [],
};
