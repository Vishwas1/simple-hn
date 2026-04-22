import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{vue,ts,js,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f4f6f2',
        panel: '#ffffff',
        line: '#d7dfd2',
        ink: '#17201a',
        mute: '#6a766c',
        accent: '#264f3d',
        'accent-soft': '#eef4ef',
        glow: '#dbe9dc',
      },
      boxShadow: {
        panel: '0 18px 40px -28px rgba(25, 39, 31, 0.32)',
      },
      borderRadius: {
        xl2: '1.5rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
