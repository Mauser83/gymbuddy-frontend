import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  ViewStyle,
  StyleProp,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';

import { useTheme } from 'src/shared/theme/ThemeProvider';

interface ScreenLayoutProps {
  children: React.ReactNode;

  variant?: 'default' | 'centered';
  scroll?: boolean;
  /**
   * When true (default) tapping outside of inputs will dismiss the keyboard.
   * This wrapper can interfere with inner scroll views, so allow disabling.
   */
  dismissKeyboardOnPress?: boolean;
}

const ScreenLayout = ({
  children,
  variant = 'default',
  scroll = false,
  dismissKeyboardOnPress = true,
}: ScreenLayoutProps) => {
  const { theme, componentStyles } = useTheme();

  const contentStyle =
    componentStyles.screenLayout[variant === 'centered' ? 'centeredContainer' : 'container'];

  const webContainerStyle: ViewStyle =
    Platform.OS === 'web'
      ? {
          width: '100%', // Restore this for responsiveness
          maxWidth: 400,
          alignSelf: 'center',
        }
      : {};

  const wrapWithDismiss = (inner: React.ReactNode, style: StyleProp<ViewStyle>) => {
    const content = <View style={style}>{inner}</View>;
    if (Platform.OS !== 'web' && dismissKeyboardOnPress) {
      return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          {content}
        </TouchableWithoutFeedback>
      );
    }
    return content;
  };

  const renderContent = () => {
    if (scroll) {
      return (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[contentStyle, webContainerStyle]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {wrapWithDismiss(children, styles.flex)}
        </ScrollView>
      );
    }

    if (Platform.OS === 'web') {
      return <View style={[styles.flex, contentStyle, webContainerStyle]}>{children}</View>;
    }

    return wrapWithDismiss(children, [styles.flex, contentStyle, webContainerStyle]);
  };

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.surface]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          {renderContent()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: { flex: 1 },
});

export default ScreenLayout;
