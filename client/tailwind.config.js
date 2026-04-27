/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Manrope', 'ui-sans-serif', 'sans-serif']
      },
      colors: {
        ink: {
          50: '#f6f6f4',
          100: '#eceeea',
          500: '#6e736f',
          700: '#334154',
          900: '#08111d'
        },
        mint: {
          100: '#d7fff4',
          300: '#75f1c1',
          500: '#10b981',
          700: '#057a55'
        },
        copper: {
          100: '#fee6c8',
          300: '#ffb663',
          500: '#f59e0b',
          700: '#b86708'
        },
        coral: {
          100: '#ffe0db',
          300: '#ff9b8a',
          500: '#ef6c57',
          700: '#b5412e'
        }
      },
      boxShadow: {
        panel: '0 30px 80px -40px rgba(8, 17, 29, 0.55)',
        soft: '0 20px 60px -32px rgba(15, 23, 42, 0.28)'
      },
      backgroundImage: {
        'hero-glow':
          'radial-gradient(circle at top left, rgba(16,185,129,0.18), transparent 30%), radial-gradient(circle at top right, rgba(245,158,11,0.16), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0))'
      },
      keyframes: {
        shimmer: {
          '100%': {
            transform: 'translateX(100%)'
          }
        }
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite'
      }
    }
  },
  plugins: []
};
