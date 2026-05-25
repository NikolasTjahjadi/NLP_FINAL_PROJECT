/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Instrument Serif"', 'serif'],
        sans: ['"Geist"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          50:  '#F4F4F5',
          100: '#E4E4E7',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
          950: '#09090B',
        },
        accent: {
          neg: '#FF6B6B',
          neu: '#FFD93D',
          pos: '#6BCF7F',
        }
      },
      backgroundImage: {
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(28,100%,74%,0.08) 0px, transparent 50%),radial-gradient(at 80% 0%, hsla(189,100%,56%,0.06) 0px, transparent 50%),radial-gradient(at 0% 50%, hsla(355,100%,93%,0.04) 0px, transparent 50%),radial-gradient(at 80% 50%, hsla(340,100%,76%,0.05) 0px, transparent 50%),radial-gradient(at 0% 100%, hsla(269,100%,77%,0.06) 0px, transparent 50%),radial-gradient(at 80% 100%, hsla(242,100%,70%,0.05) 0px, transparent 50%),radial-gradient(at 0% 0%, hsla(343,100%,76%,0.04) 0px, transparent 50%)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out forwards',
        'slide-up':   'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp:   { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        glowPulse: { '0%, 100%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.1)' }, '50%': { boxShadow: '0 0 30px rgba(168, 85, 247, 0.25)' } },
      }
    }
  },
  plugins: []
}
