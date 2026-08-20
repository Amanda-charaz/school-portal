import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const theme = {
    bg: darkMode ? "#2A2620" : "#F5F0E6",
    card: darkMode ? "#1F1E18" : "#FFFDF8",
    text: darkMode ? "#E8E4DC" : "#172033",
    subText: darkMode ? "#A8A49C" : "#6B6B63",
    inputBg: darkMode ? "#1F1E18" : "#FFFDF8",
    inputBorder: darkMode ? "#3D3830" : "#DDD6C8",
    tableHeader: darkMode ? "#1F1E18" : "#FFFDF8",
    accent: "#A52A2A", // Brand Red
    accentBlue: "#003DA5", // Brand Blue
    accentBlueDark: "#002F80", // Brand Blue Dark
    accentRedDark: "#8B1E1E", // Brand Red Dark
  };

  return (
    <ThemeContext.Provider value={{ theme, darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};