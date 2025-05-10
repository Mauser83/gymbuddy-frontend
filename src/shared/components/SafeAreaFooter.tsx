import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaFooterProps {
  children: ReactNode;
}

const SafeAreaFooter = ({ children }: SafeAreaFooterProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {children}
    </View>
  );
};

export default SafeAreaFooter;

// File-specific styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#78350f',
  },
});
