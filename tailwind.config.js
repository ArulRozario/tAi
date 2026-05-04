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
        primary: '#1a1a2e',    // Header, sidebar
        secondary: '#16213e',  // Cards, panels
        background: '#0f0f23', // Main content
        surface: '#1f1f3a',    // Input fields, modals
        accent: '#e94560',     // Primary buttons, highlights
        success: '#4ecca3',    // Approved status
        warning: '#ffc107',    // Pending review
        error: '#ff6b6b',      // Critical issues
        'text-primary': '#eaeaea',
        'text-secondary': '#a0a0a0',
        border: '#2a2a4a',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
} satisfies Config;