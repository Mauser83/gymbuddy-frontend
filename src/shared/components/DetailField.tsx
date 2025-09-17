// shared/components/DetailField.tsx
import React from 'react';
import { View, Text, ViewStyle } from 'react-native';

import { useTheme } from 'src/shared/theme/ThemeProvider';

interface DetailFieldProps {
  label: string;
  value: string;
  vertical?: boolean;
}

const DetailField = ({ label, value, vertical = true }: DetailFieldProps) => {
  const { componentStyles } = useTheme();

  if (typeof label !== 'string' || typeof value !== 'string') {
    console.warn('DetailField received invalid props:', { label, value });
    return null;
  }

  const styles = componentStyles.detailField;

  const containerStyle: ViewStyle = {
    flexDirection: vertical ? 'column' : 'row',
    alignItems: vertical ? 'flex-start' : 'center',
    marginBottom: 8,
  };

  const labelStyle = [
    styles.label,
    !vertical && { marginRight: 6 }, // spacing between label and value when horizontal
  ];

  return (
    <View style={containerStyle}>
      <Text style={labelStyle}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

export default DetailField;
