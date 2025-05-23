import React from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import { useTheme } from 'shared/theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

const ContentContainer = ({ children, style }: Props) => {
  const { theme } = useTheme();

  const baseStyle: ViewStyle = {
    width: '100%',
    flex: 1,
    ...(Platform.OS === 'web' && {
      maxWidth: 400,
      alignSelf: 'center',
    }),
  };

  return (
    <View style={{ backgroundColor: theme.colors.background, flex: 1 }}>
      <View style={[baseStyle, style]}>
        {children}
      </View>
    </View>
  );
};

export default ContentContainer;
