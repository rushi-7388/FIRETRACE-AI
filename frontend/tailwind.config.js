/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ember: '#FF4500',
        ash:   '#8B8680',
        smoke: '#4A4A4A',
        glow:  '#FFD700',
        // extra fire palette
        'fire-deep':   '#800026',
        'fire-red':    '#FC4E2A',
        'fire-orange': '#FEB24C',
        'fire-yellow': '#FFFFCC',
        // dark-UI
        'bg-primary':   '#0D1117',
        'bg-secondary': '#161B22',
        'bg-card':      '#1C2128',
        'bg-hover':     '#21262D',
        'border-muted': '#30363D',
        'text-primary': '#E6EDF3',
        'text-muted':   '#7D8590',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'flame-pulse': 'flamePulse 2s ease-in-out infinite',
        'fade-in':     'fadeIn 0.4s ease-out',
        'slide-up':    'slideUp 0.3s ease-out',
      },
      keyframes: {
        flamePulse: {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':      { opacity: '0.7', transform: 'scale(1.08)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'glow-ember': '0 0 12px 2px rgba(255,69,0,0.4)',
        'glow-gold':  '0 0 12px 2px rgba(255,215,0,0.3)',
      },
    },
  },
  plugins: [],
}
