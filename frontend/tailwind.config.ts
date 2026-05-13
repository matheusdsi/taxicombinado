import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        taxi: {
          50:  '#FFF6D6',
          100: '#FFF0B3',
          200: '#FFE480',
          300: '#FFD74D',
          400: '#F5C800',
          500: '#F5B800',
          600: '#E0A800',
          700: '#B88C00',
          800: '#8A6900',
          900: '#5C4600',
        },
        brand: {
          yellow: '#F5B800',
          dark:   '#111827',
          gray:   '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Helvetica Neue', 'Helvetica', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 2px 16px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.12)',
        result: '0 8px 32px rgba(245, 166, 35, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
