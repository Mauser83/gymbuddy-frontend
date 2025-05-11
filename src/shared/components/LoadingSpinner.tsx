import React from 'react';
import {ActivityIndicator, ViewStyle} from 'react-native';
import {useTheme} from 'shared/theme/ThemeProvider';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  style?: ViewStyle;
}

const LoadingSpinner = ({size = 'large', style}: LoadingSpinnerProps) => {
  const {theme} = useTheme();

  return (
    <ActivityIndicator
      size={size}
      color={theme.colors.accentStart}
      style={[{marginTop: 24}, style]}
    />
  );
};

export default LoadingSpinner;
