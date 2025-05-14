import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
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
  scroll = true,
}: ScreenLayoutProps) => {
  const { theme, componentStyles } = useTheme();
  const layoutStyle =
    componentStyles.screenLayout[
      variant === 'centered' ? 'centeredContainer' : 'container'
    ];

  const Container = scroll ? ScrollView : View;
  const containerProps = scroll
    ? {
        contentContainerStyle: layoutStyle,
        keyboardShouldPersistTaps: 'handled' as const,
      }
    : {
        style: layoutStyle,
      };

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.surface]}
      style={styles.gradient}
      pointerEvents="box-none" // ensure modals show properly
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoiding}
      >
        <Container {...containerProps}>{children}</Container>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
    width: '100%',
  },
});

export default ScreenLayout;
