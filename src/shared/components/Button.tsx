import React from 'react';
import {Text, View, TouchableOpacity, ColorValue} from 'react-native';
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
}

const Button = ({
  text,
  onPress,
  variant,
  accessibilityLabel,
  icon,
  iconPosition = 'left',
  disabled,
}: ButtonProps) => {
  const {theme, componentStyles} = useTheme();
  const buttonVariant = variant ?? theme.components.button.variant;
  const styles = componentStyles.button;

  const textColor = theme.colors.buttonText;

  const renderContent = () => (
    <View style={styles.content}>
      {icon && iconPosition === 'left' && (
        <View style={styles.icon}>{icon}</View>
      )}
      <Text style={{...styles.text, color: textColor}}>{text}</Text>
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
        style={[styles.wrapper, disabled && {opacity: 0.6}]}>
        <LinearGradient
          colors={
            [theme.colors.accentStart, theme.colors.accentEnd] as [
              ColorValue,
              ColorValue,
            ]
          }
          style={styles.gradient}>
          {renderContent()}
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
        style={[styles.outlineWrapper, disabled && {opacity: 0.6}]}>
        <Text style={styles.outlineText}>{text}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.colors.accentStart,
          shadowColor:
            theme.mode === 'light' ? '#000' : theme.colors.accentStart,
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 4,
        },
      ]}>
      <View style={styles.gradient}>{renderContent()}</View>
    </TouchableOpacity>
  );
};

export default Button;
