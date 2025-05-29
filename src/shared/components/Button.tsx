import React from 'react';
import {Text, View, TouchableOpacity, StyleSheet} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from 'shared/theme/ThemeProvider';

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
  const {theme, componentStyles} = useTheme();
  const buttonVariant = variant ?? theme.components.button.variant;
  const styles = componentStyles.button;

  const content = (
    <View style={styles.content}>
      {icon && iconPosition === 'left' && (
        <View style={styles.icon}>{icon}</View>
      )}
      <Text
        style={[
          styles.text,
          {color: theme.colors.buttonText},
          disabled && styles.disabledText,
        ]}>
        {text}
      </Text>
      {icon && iconPosition === 'right' && (
        <View style={styles.icon}>{icon}</View>
      )}
    </View>
  );

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
        ]}>
        <LinearGradient
          colors={
            disabled
              ? [theme.colors.disabledSurface, theme.colors.disabledSurface]
              : [theme.colors.accentStart, theme.colors.accentEnd]
          }
          style={small ? base.smallGradient : base.gradient}>
          <View style={styles.content}>
            {icon && iconPosition === 'left' && (
              <View style={styles.icon}>{icon}</View>
            )}
            <Text
              style={[
                styles.text,
                small && base.smallText,
                {color: theme.colors.buttonText},
                disabled && styles.disabledText,
              ]}>
              {text}
            </Text>
            {icon && iconPosition === 'right' && (
              <View style={styles.icon}>{icon}</View>
            )}
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
        ]}>
        <Text
          style={[
            base.outlineText,
            small && base.smallText,
            disabled && base.disabledText,
          ]}>
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
      <View style={styles.content}>
        {icon && iconPosition === 'left' && (
          <View style={styles.icon}>{icon}</View>
        )}
        <Text
          style={[
            styles.text,
            small && base.smallText,
            {color: theme.colors.buttonText},
            disabled && styles.disabledText,
          ]}>
          {text}
        </Text>
        {icon && iconPosition === 'right' && (
          <View style={styles.icon}>{icon}</View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const base = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'stretch', // 👈 key fix: ensures button stretches only to container width
  },
  gradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  outlineWrapper: {
    borderWidth: 2,
    borderColor: '#999',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  outlineText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginHorizontal: 4,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.6,
  },
  fullWidth: {
    flex: 1,
  },
  smallWrapper: {
    borderRadius: 999,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  smallGradient: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default Button;
