import type { Config } from 'tailwindcss';

export default {
  content: [
    './apps/frontend/src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1', // Indigo
          dark: '#4f46e5',
          light: '#818cf8',
        },
        background: '#0f172a', // Deep Slate/Navy
        surface: {
          DEFAULT: '#1e293b', // Slate 800
          light: '#334155',  // Slate 700
          dark: '#0f172a',   // Slate 900
        },
        accent: {
          DEFAULT: '#10b981', // Emerald
          dark: '#059669',
          light: '#34d399',
        },
        'text-primary': '#f8fafc', // Slate 50
        'text-secondary': '#94a3b8', // Slate 400
        border: 'rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
} satisfies Config;