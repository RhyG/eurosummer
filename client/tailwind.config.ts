import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F7F1E5',
        terracotta: '#C65D3A',
        olive: '#6B7C3A',
        sand: '#C9A66B',
        wheat: '#D9B382',
        slate2: '#6B7280',
        ink: '#2A2520',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        sheet: '0 -8px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
