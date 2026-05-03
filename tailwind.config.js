import type { Config } from 'tailwindcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  content: [
    './apps/frontend/src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a2e',
        secondary: '#16213e',
        background: '#0f0f23',
        surface: '#1f1f3a',
        accent: '#e94560',
      },
    },
  },
  plugins: [],
} satisfies Config;