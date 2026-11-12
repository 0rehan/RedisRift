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
        dark: {
          950: '#030712',
          900: '#090d16',
          850: '#0c1220',
          800: '#0f172a',
          750: '#131c31',
          700: '#1e293b',
        },
      },
      boxShadow: {
        'glow-brand': '0 0 25px -5px rgba(244, 63, 94, 0.25)',
        'glow-sky': '0 0 25px -5px rgba(56, 189, 248, 0.25)',
        'glow-rose': '0 0 20px -5px rgba(244, 63, 94, 0.3)',
        'glow-violet': '0 0 20px -5px rgba(139, 92, 246, 0.3)',
        'glow-emerald': '0 0 20px -5px rgba(52, 211, 153, 0.3)',
        'glow-indigo': '0 0 20px -5px rgba(99, 102, 241, 0.3)',
      },
      backdropBlur: {
        xl: '24px',
        '2xl': '40px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px 0 rgba(244, 63, 94, 0.15)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(244, 63, 94, 0.3)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 2s linear infinite',
      },
    },
  },
  plugins: [],
};
