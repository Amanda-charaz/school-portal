/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',

  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        primary: "#2563eb",
        secondary: "#7c3aed",
        success: "#16a34a",
        danger: "#dc2626",
        "school-blue": "#003DA5",
        "school-blue-dark": "#002966",
        "school-red": "#B22222",
        "school-red-dark": "#8B1A1A",
        "school-red-light": "#FF6B6B",
      },
      screens: {
        'xs': '320px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },

  plugins: [],
}