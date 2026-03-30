/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-green': '#00ff00',
        'neon-green-dark': '#00cc00',
        'neon-green-light': '#33ff33',
        'neon-blue': '#00aaff',
        'neon-blue-dark': '#007acc',
        'neon-yellow': '#ffe500',
        'neon-yellow-dark': '#ccb800',
      },
      fontFamily: {
        'logo': ['"Orbitron"', 'sans-serif'],      // Logo / brand
        'header': ['"Oxanium"', 'sans-serif'],     // Section headers
        'title': ['"Rajdhani"', 'sans-serif'],     // Panel/card titles
        'menu': ['"Rajdhani"', 'sans-serif'],      // Titles (alias)
        'body': ['"Inter"', 'sans-serif'],         // UI text, labels, body
        'score': ['"Share Tech Mono"', 'monospace'],
        'brutal': ['"Bungee"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
