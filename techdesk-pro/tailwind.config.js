/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}','./components/**/*.{js,jsx}','./app/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ink: '#0A0F1E',
        electric: '#00D4FF',
        volt: '#7BFF6A',
        card: '#141C2F',
        mist: '#8B9BB4',
      },
    },
  },
  plugins: [],
}
