import React from 'react';
import { Text } from 'react-native';

import { useTheme } from 'src/shared/theme/ThemeProvider';
import { fontSizes, fontWeights, spacing } from 'src/shared/theme/tokens';

interface FormErrorProps {
  message: string;
}

const FormError = ({ message }: FormErrorProps) => {
  const { theme } = useTheme();
  return (
    <Text
      style={{
        color: theme.colors.error,
        fontSize: fontSizes.xl,
        paddingBottom: spacing.lg,
        fontWeight: fontWeights.bold,
      }}
    >
      {message}
    </Text>
  );
};

export default FormError;
