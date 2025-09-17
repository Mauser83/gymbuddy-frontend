import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from 'shared/theme/ThemeProvider';

interface SafeAreaFooterProps {
  children: ReactNode;
}

const SafeAreaFooter = ({ children }: SafeAreaFooterProps) => {
  const insets = useSafeAreaInsets();
  const { componentStyles } = useTheme();
  const styles = componentStyles.safeAreaFooter;

  return <View style={[styles.container, { paddingBottom: insets.bottom }]}>{children}</View>;
};

export default SafeAreaFooter;
