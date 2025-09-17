import React, { createContext, useState, useContext, ReactNode } from 'react';

import { getComponentStyles } from './themes';
import { Theme } from './types/theme.types';
import { darkOrange } from './variants/darkOrange';
// import { lightOrange } from './variants/lightOrange';

// Register all theme variants here
const themes = {
  'dark-orange': darkOrange,
  // 'light-orange': lightOrange,
};

export type ThemeName = keyof typeof themes;

interface ThemeContextProps {
  theme: Theme;
  themeName: ThemeName;
  setThemeByName: (name: ThemeName) => void;
  componentStyles: ReturnType<typeof getComponentStyles>;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeName, setThemeName] = useState<ThemeName>('dark-orange');
  const theme = themes[themeName];
  const componentStyles = getComponentStyles(theme);

  const setThemeByName = (name: ThemeName) => {
    setThemeName(name);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName, setThemeByName, componentStyles }}>
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
