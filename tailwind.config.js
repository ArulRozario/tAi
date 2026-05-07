import type { Config } from 'tailwindcss';

export default {
  content: [
    './apps/frontend/src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: {
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
        },
        border: 'var(--border)',
        text: {
          1: 'var(--text-1)',
          2: 'var(--text-2)',
          3: 'var(--text-3)',
        },
        primary: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
        },
        success: {
          DEFAULT: 'var(--success)',
          soft: 'var(--success-soft)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          soft: 'var(--warning-soft)',
        },
        error: {
          DEFAULT: 'var(--error)',
          soft: 'var(--error-soft)',
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      spacing: {
        'sp-5': '1.25rem',
        'sp-6': '1.5rem',
      }
    },
  },
  plugins: [],
} satisfies Config;