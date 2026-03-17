/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#0A0A0A',
        surface: '#121212',
        card: '#1E1E1E',
        muted: '#DADADA',
        accent: '#00CCCB',
        danger: '#FF3D3D',
        warning: '#FFD910',
      },
    },
  },
  plugins: [],
};
