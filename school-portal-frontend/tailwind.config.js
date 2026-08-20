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
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '20px',
        '2xl': '24px',
      },
      fontWeight: {
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      lineHeight: {
        'tight': '1.25',
        'snug': '1.3',
        'normal': '1.4',
        'relaxed': '1.5',
      },
      letterSpacing: {
        'wide': '0.02em',
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