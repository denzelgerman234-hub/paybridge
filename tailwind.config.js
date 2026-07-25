/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette
        navy: {
          950: '#0B132F',
          900: '#0D1632',
          800: '#12203F',
          700: '#1B2D56',
        },
        cream: {
          DEFAULT: '#F1F0DA',
          dim:     'rgba(241,240,218,0.55)',
          faint:   'rgba(241,240,218,0.07)',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light:   '#D4B55A',
          dim:     'rgba(201,168,76,0.12)',
        },
        terra: {
          DEFAULT: '#C8523D',
          dim:     'rgba(200,82,61,0.12)',
        },
        sage: {
          DEFAULT: '#7DC99A',
        },
        // legacy aliases — don't remove, used in components
        primary: {
          300: '#D4B55A',
          400: '#C9A84C',
          500: '#B89038',
        },
        accent: {
          400: '#C8523D',
          500: '#B84530',
        },
        emerald: {
          400: '#7DC99A',
          500: '#5BB07C',
        },
        surface: {
          DEFAULT: '#0B132F',
          card:    '#0D1632',
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", 'system-ui', 'sans-serif'],
        sans:    ["'Inter'", 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(160deg, #0B132F 0%, #12203F 50%, #0B132F 100%)',
        'gold-line':     'linear-gradient(90deg, transparent, #C9A84C, transparent)',
      },
      animation: {
        'fade-in':    'fadeIn 0.25s ease both',
        'slide-up':   'slideUp 0.3s ease both',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      boxShadow: {
        // Flat — no glow
        'card':  '0 1px 4px rgba(0,0,0,0.4)',
        'input': '0 1px 2px rgba(0,0,0,0.3)',
      },
      borderRadius: {
        'sm':  '3px',
        'DEFAULT': '4px',
        'md':  '6px',
        'lg':  '8px',
        'xl':  '10px',
        '2xl': '12px',
        'full': '9999px',
      },
    },
  },
  plugins: [],
};
