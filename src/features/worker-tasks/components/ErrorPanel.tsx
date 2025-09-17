import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { View, Text } from 'react-native';

import Button from 'src/shared/components/Button';
import { useTheme } from 'src/shared/theme/ThemeProvider';
import { spacing } from 'src/shared/theme/tokens';

interface ErrorPanelProps {
  error?: string | null;
}

const ErrorPanel = ({ error }: ErrorPanelProps) => {
  const { theme } = useTheme();
  if (!error) return null;

  const copy = async () => {
    const nav: any = (globalThis as any).navigator;
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(error);
    } else if (typeof Clipboard?.setStringAsync === 'function') {
      await Clipboard.setStringAsync(error);
    }
  };

  return (
    <View
      style={{
        padding: spacing.md,
        backgroundColor: theme.colors.glass.background,
      }}
    >
      <Text
        selectable
        style={{
          fontFamily: 'monospace',
          color: theme.colors.textPrimary,
          marginBottom: spacing.sm,
        }}
      >
        {error}
      </Text>
      <Button text="Copy" onPress={copy} small />
    </View>
  );
};

export default ErrorPanel;
