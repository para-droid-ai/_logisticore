
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'terminal-green': '#39FF14',
        'terminal-cyan': '#00FFFF',
        'terminal-red': '#FF003F',
        'terminal-yellow': '#FFFF00',
        'terminal-blue': '#00BFFF',
        'terminal-gray': {
          DEFAULT: '#808080',
          dark: '#333333',
          light: '#CCCCCC',
          darker: '#1A1A1A',
          panel: '#222831' // A dark bluish gray for panels
        },
      },
      fontFamily: {
        mono: ['"Courier New"', 'monospace'], // A common monospace font
      },
      boxShadow: {
        'glow-green': '0 0 5px #39FF14, 0 0 10px #39FF14',
        'glow-cyan': '0 0 5px #00FFFF, 0 0 10px #00FFFF',
        'glow-red': '0 0 5px #FF003F, 0 0 10px #FF003F',
      }
    },
  },
  plugins: [],
}
    