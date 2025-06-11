// Usage Example:
// import ExerciseGroupCard from '../components/ExerciseGroupCard';

// <ExerciseGroupCard
//   label="Superset (2–2)"
//   borderColor={theme.colors.accentStart}
//   textColor={theme.colors.textPrimary}>
//   {group.exercises.map((exercise, idx) =>
//     renderNormalItem({ item: exercise, index: idx })
//   )}
// </ExerciseGroupCard>

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from 'shared/theme/ThemeProvider';
import { borderRadius, spacing } from 'shared/theme/tokens';

type ExerciseGroupCardProps = {
  label: string;
  children: React.ReactNode;
  borderColor?: string;
  textColor?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
};

export default function ExerciseGroupCard({
  label,
  children,
  borderColor,
  textColor,
  backgroundColor,
  style,
  labelStyle,
}: ExerciseGroupCardProps) {
  const { theme } = useTheme();

  const finalBorderColor = borderColor ?? theme.colors.accentStart;
  const finalTextColor = textColor ?? theme.colors.textPrimary;
  const finalBackground = backgroundColor ?? theme.colors.background;

  return (
    <View style={[styles.container, { borderColor: finalBorderColor }, style]}>
      <Text
        style={[
          styles.label,
          {
            color: finalTextColor,
            backgroundColor: finalBackground,
          },
          labelStyle,
        ]}>
        {label}
      </Text>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: borderRadius.lg,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    position: 'relative',
    marginBottom: spacing.md,
  },
  label: {
    position: 'absolute',
    top: -10,
    left: spacing.md,
    paddingHorizontal: spacing.xs,
    fontSize: 14,
    fontWeight: 'bold',
    zIndex: 1,
  },
  content: {
    marginTop: spacing.sm,
  },
});
