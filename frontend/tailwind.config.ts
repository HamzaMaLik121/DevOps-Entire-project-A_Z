import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/client-pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sumi-ink neutrals
        ink: {
          950: '#0B0A09',
          900: '#141210',
          850: '#1A1816',
          800: '#211E1B',
          700: '#2E2A26',
          600: '#443F39',
        },
        // Aka (crimson) — the warrior's color
        aka: {
          DEFAULT: '#DC2626',
          bright: '#EF4444',
          deep: '#991B1B',
          dark: '#7F1D1D',
        },
        // Kin (gold) — honor and mastery
        kin: {
          DEFAULT: '#C9A227',
          light: '#E5C158',
          dark: '#A0831C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mincho: ['"Zen Old Mincho"', '"Hiragino Mincho ProN"', 'Yu Mincho', 'serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.9s ease both',
        marquee: 'marquee 28s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
