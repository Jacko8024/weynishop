/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF1EB',
          100: '#FFDDC9',
          200: '#FFB994',
          300: '#FF8E5C',
          400: '#F46F38',
          500: '#EC5C2C',
          600: '#D14617',
          700: '#A8350F',
          800: '#7A260A',
        },
        accent: {
          50: '#FEF6E7',
          400: '#F7B946',
          500: '#F5A623',
          600: '#C4831C',
        },
        flash: '#EB5824',
        danger: {
          50: '#FDEEE7',
          100: '#FBD9C8',
          200: '#F8B594',
          500: '#EB5824',
          600: '#C7461A',
          700: '#9D3613',
        },
        surface: 'var(--color-surface)',
        page: 'var(--color-bg)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        ethiopic: ['"Noto Serif Ethiopic"', 'serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        page: '1400px',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.7)', opacity: '0' },
          '60%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        flipDown: {
          '0%': { transform: 'rotateX(0)' },
          '100%': { transform: 'rotateX(-180deg)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
        bounceIn: 'bounceIn 0.4s ease-out',
        fadeIn: 'fadeIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
