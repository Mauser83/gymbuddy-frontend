import { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

// StatusBarManager.tsx
const StatusBarManager = () => {
  const { theme, themeName } = useTheme();

  useEffect(() => {
    StatusBar.setBarStyle(themeName === 'dark-orange' ? 'light-content' : 'dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(theme.colors.background);
    }
  }, [theme, themeName]);

  return <StatusBar />;
};

export default StatusBarManager;
