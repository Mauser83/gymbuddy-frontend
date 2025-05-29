import React from 'react';
import {TouchableOpacity, View, StyleSheet} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from 'shared/theme/ThemeProvider';

type IconButtonVariant = 'gradient' | 'solid';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  variant?: IconButtonVariant;
  accessibilityLabel?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
}

const IconButton = ({
  icon,
  onPress,
  variant = 'gradient',
  accessibilityLabel,
  disabled = false,
  size = 'medium',
}: IconButtonProps) => {
  const {theme} = useTheme();

  const isSmall = size === 'small';
  const wrapperStyle = isSmall ? styles.small : styles.medium;

  if (variant === 'gradient') {
    return (
      <TouchableOpacity
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        activeOpacity={disabled ? 1 : 0.8}
        style={[wrapperStyle, disabled && styles.disabled]}>
        <LinearGradient
          colors={
            disabled
              ? [theme.colors.disabledSurface, theme.colors.disabledSurface]
              : [theme.colors.accentStart, theme.colors.accentEnd]
          }
          style={wrapperStyle}>
          {icon}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeOpacity={disabled ? 1 : 0.8}
      style={[
        wrapperStyle,
        {
          backgroundColor: disabled
            ? theme.colors.disabledSurface
            : theme.colors.accentStart,
          shadowColor:
            theme.mode === 'light' ? '#000' : theme.colors.accentStart,
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 4,
        },
      ]}>
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  small: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medium: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default IconButton;
