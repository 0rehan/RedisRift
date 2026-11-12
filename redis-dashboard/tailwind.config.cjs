/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
        },
      },
      boxShadow: {
        'glow-brand': '0 0 25px -5px rgba(244, 63, 94, 0.25)',
        'glow-sky': '0 0 25px -5px rgba(56, 189, 248, 0.25)',
      },
    },
  },
  plugins: [],
};
