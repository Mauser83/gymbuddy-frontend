import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaHeaderProps {
  children: ReactNode;
}

const SafeAreaHeader = ({ children }: SafeAreaHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }}>
      {children}
    </View>
  );
};

export default SafeAreaHeader;