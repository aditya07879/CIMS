/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        display: ['Syne', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#fff1ef',
          100: '#ffe0db',
          200: '#ffc5bc',
          300: '#ff9e91',
          400: '#fb7d6d',
          500: '#F97362',
          600: '#e55a49',
          700: '#c43f30',
          800: '#a0342a',
          900: '#832e28',
        },
        surface: {
          DEFAULT: '#1E293B',
          deep:    '#141E2E',
          card:    '#243044',
          border:  '#2D3F5A',
          hover:   '#2A3A52',
          glass:   'rgba(36,48,68,0.7)',
        },
      },
    },
  },
  plugins: [],
};
