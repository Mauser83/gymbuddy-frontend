+45
-0

import React from 'react';
import {View, Text} from 'react-native';
import Button from 'shared/components/Button';
import {spacing} from 'shared/theme/tokens';
import {useTheme} from 'shared/theme/ThemeProvider';
import * as Clipboard from 'expo-clipboard';

interface ErrorPanelProps {
  error?: string | null;
}

const ErrorPanel = ({error}: ErrorPanelProps) => {
  const {theme} = useTheme();
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
      }}>
      <Text
        selectable
        style={{
          fontFamily: 'monospace',
          color: theme.colors.textPrimary,
          marginBottom: spacing.sm,
        }}>
        {error}
      </Text>
      <Button variant="outline" text="Copy" onPress={copy} small />
    </View>
  );
};

export default ErrorPanel;