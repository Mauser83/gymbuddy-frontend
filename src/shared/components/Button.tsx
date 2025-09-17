import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';

import { useTheme } from 'src/shared/theme/ThemeProvider';

type ButtonVariant = 'gradient' | 'solid' | 'outline';

interface ButtonProps {
  text: string;
  onPress: () => void;
  variant?: ButtonVariant;
  accessibilityLabel?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  fullWidth?: boolean;
  small?: boolean; // ✅ NEW
}

const Button = ({
  text,
  onPress,
  variant,
  accessibilityLabel,
  icon,
  iconPosition = 'left',
  disabled,
  fullWidth,
  small,
}: ButtonProps) => {
  const { theme, componentStyles } = useTheme();
  const buttonVariant = variant ?? theme.components.button.variant;
  const styles = componentStyles.button;

  if (buttonVariant === 'gradient') {
    return (
      <TouchableOpacity
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        activeOpacity={disabled ? 1 : 0.8}
        style={[
          small ? base.smallWrapper : base.wrapper,
          fullWidth && base.fullWidth,
          disabled && base.disabled,
        ]}
      >
        <LinearGradient
          colors={
            disabled
              ? [theme.colors.disabledSurface, theme.colors.disabledSurface]
              : [theme.colors.accentStart, theme.colors.accentEnd]
          }
          style={small ? base.smallGradient : base.gradient}
        >
          <View style={styles.content}>
            {icon && iconPosition === 'left' && <View style={styles.icon}>{icon}</View>}
            <Text
              style={[
                styles.text,
                small && base.smallText,
                { color: theme.colors.buttonText },
                disabled && styles.disabledText,
              ]}
            >
              {text}
            </Text>
            {icon && iconPosition === 'right' && <View style={styles.icon}>{icon}</View>}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (buttonVariant === 'outline') {
    return (
      <TouchableOpacity
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        activeOpacity={disabled ? 1 : 0.8}
        style={[
          base.outlineWrapper,
          small && base.smallWrapper,
          fullWidth && base.fullWidth,
          disabled && base.disabled,
        ]}
      >
        <Text style={[base.outlineText, small && base.smallText, disabled && base.disabledText]}>
          {text}
        </Text>
      </TouchableOpacity>
    );
  }

  // solid fallback
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        small ? base.smallWrapper : base.wrapper,
        fullWidth && base.fullWidth,
        {
          backgroundColor: disabled ? theme.colors.disabledSurface : theme.colors.accentStart,
          shadowColor: theme.mode === 'light' ? '#000' : theme.colors.accentStart,
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 4,
        },
      ]}
    >
      <View style={styles.content}>
        {icon && iconPosition === 'left' && <View style={styles.icon}>{icon}</View>}
        <Text
          style={[
            styles.text,
            small && base.smallText,
            { color: theme.colors.buttonText },
            disabled && styles.disabledText,
          ]}
        >
          {text}
        </Text>
        {icon && iconPosition === 'right' && <View style={styles.icon}>{icon}</View>}
      </View>
    </TouchableOpacity>
  );
};

const base = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.6,
  },
  fullWidth: {
    flex: 1,
  },
  gradient: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  outlineText: {
    fontSize: 16,
    fontWeight: '600',
  },
  outlineWrapper: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderColor: '#999',
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  smallGradient: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallText: {
    fontSize: 13,
    fontWeight: '500',
  },
  smallWrapper: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    overflow: 'hidden',
  },
  wrapper: {
    alignSelf: 'stretch',
    borderRadius: 12,
    overflow: 'hidden', // 👈 key fix: ensures button stretches only to container width
  },
});

export default Button;
