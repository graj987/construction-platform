/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#E85C2C', 50: '#FEF0EB', 100: '#FCDDD2', 500: '#E85C2C', 600: '#D14A1C', 700: '#B83D14' },
        secondary: { DEFAULT: '#1A1A2E', 700: '#16162A', 800: '#0F0F1E', 900: '#0A0A14' },
        accent: { DEFAULT: '#F5A623', light: '#FFF3D6' },
        surface: { DEFAULT: '#FFFFFF', muted: '#F8F9FA', card: '#FFFFFF' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
