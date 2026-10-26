/** @type {import('tailwindcss').Config} */
module.exports = Object.assign(
{
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          },
          colors: {
            brand: {
              bg: '#0d0d0f',
              card: '#131316',
              border: '#1f1f24',
              cyan: '#00f2fe',
              blue: '#38bdf8',
              textPrimary: '#f8fafc',
              textSecondary: '#94a3b8',
            }
          },
          animation: {
            'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }
        }
      }
    },
  { content: ["./index.html"] }
);
