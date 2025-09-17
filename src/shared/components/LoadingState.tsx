import React from 'react';
import { View, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

import { useTheme } from 'shared/theme/ThemeProvider';

interface LoadingStateProps {
  text?: string;
  size?: 'small' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const LoadingState = ({
  text = 'Loading...',
  size = 'large',
  style,
  textStyle,
}: LoadingStateProps) => {
  const { theme, componentStyles } = useTheme();
  const styles = componentStyles.loadingState;

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.text, textStyle]}>{text}</Text>
      <ActivityIndicator size={size} color={theme.colors.accentStart} style={styles.spinner} />
    </View>
  );
};

export default LoadingState;
