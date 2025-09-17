import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from 'src/shared/theme/ThemeProvider';

interface SafeAreaHeaderProps {
  children: ReactNode;
}

const SafeAreaHeader = ({ children }: SafeAreaHeaderProps) => {
  const insets = useSafeAreaInsets();
  const { componentStyles } = useTheme();
  const styles = componentStyles.safeAreaHeader;

  return <View style={[styles.container, { paddingTop: insets.top }]}>{children}</View>;
};

export default SafeAreaHeader;
