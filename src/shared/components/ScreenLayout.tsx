+18
-13

// The final, correct version of src/shared/components/ScreenLayout.tsx

import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  ViewStyle, // Import ViewStyle
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from 'shared/theme/ThemeProvider';

interface ScreenLayoutProps {
  children: React.ReactNode;
  variant?: 'default' | 'centered';
  scroll?: boolean;
}

const ScreenLayout = ({
  children,
  variant = 'default',
  scroll = false,
}: ScreenLayoutProps) => {
  const {theme, componentStyles} = useTheme();

  const contentStyle =
    componentStyles.screenLayout[
      variant === 'centered' ? 'centeredContainer' : 'container'
    ];

  const webContainerStyle: ViewStyle =
    Platform.OS === 'web'
      ? {
          width: '100%', // Restore this for responsiveness
          maxWidth: 400,
          alignSelf: 'center',
        }
      : {};

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.surface]}
      style={styles.gradient}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={[styles.flex, webContainerStyle]}>
              {scroll ? (
                <ScrollView
                  style={styles.flex}
                  contentContainerStyle={contentStyle}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag">
                  {children}
                </ScrollView>
              ) : (
                <View style={[styles.flex, contentStyle]}>{children}</View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
});

export default ScreenLayout;