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
        warning: "#f59e0b",
        info: "#3b82f6",
        // New School Brand Colors
        "school-red": "#A52A2A",
        "school-red-dark": "#8B1E1E",
        "school-blue": "#003DA5",
        "school-blue-dark": "#002F80",
        "school-beige": "#F5F0E6",
        "school-cream": "#FFFDF8",
        "school-text": "#172033",
        "school-muted": "#6B6B63",
        "school-border": "#DDD6C8",
        // Dark mode versions
        "school-beige-dark": "#2A2620",
        "school-cream-dark": "#1F1E18",
        "school-text-dark": "#E8E4DC",
        "school-muted-dark": "#A8A49C",
        "school-border-dark": "#3D3830",
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