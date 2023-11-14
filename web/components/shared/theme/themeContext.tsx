import { createContext, useContext, useEffect, useState } from "react";
import { useLocalStorage } from "../../../services/hooks/localStorage";
import { clsx } from "../clsx";

export interface ThemeContextValue {
  theme: string;
  setTheme: (theme: "light" | "dark") => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const useThemeContextManager = () => {
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");

  const setThemeHandler = (theme: "light" | "dark") => {
    setTheme(theme);
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
  };

  let themeContextValue: ThemeContextValue | null = null;
  if (theme) {
    themeContextValue = {
      theme,
      setTheme: setThemeHandler,
    };
  }
  return themeContextValue;
};

export const ThemeContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const themeContextValue = useThemeContextManager();

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <div className={clsx(themeContextValue?.theme)}>
        <div className="h-full min-h-screen bg-gray-100 dark:bg-[#17191d]">
          {children}
        </div>
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
