import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({ theme: "light", toggleTheme: () => {} });

/**
 * Provides theme state and a toggle function to descendants while syncing the document root's `dark` class with the active theme.
 *
 * Initializes theme from the system preference on first mount, updates `document.documentElement` to add or remove the `dark` class when the theme changes, and supplies `{ theme, toggleTheme }` via ThemeContext.
 *
 * @param {{children: import('react').ReactNode}} props - The children to render inside the provider.
 * @returns {import('react').JSX.Element} The ThemeContext provider wrapping the given children.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Respect system preference on first load
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Provides the current theme and a function to toggle it.
 *
 * @returns {{ theme: 'light'|'dark', toggleTheme: function }} The ThemeContext value: `theme` is "light" or "dark"; `toggleTheme` switches the theme.
 */
export function useTheme() {
  return useContext(ThemeContext);
}
