// shared/components/DetailField.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from 'shared/theme/ThemeProvider';

interface DetailFieldProps {
  label: string;
  value: string;
}

const DetailField = ({ label, value }: DetailFieldProps) => {
  const { componentStyles } = useTheme();

  // Add runtime safety to avoid undefined crash
  if (typeof label !== 'string' || typeof value !== 'string') {
    console.warn('DetailField received invalid props:', { label, value });
    return null;
  }

  const styles = componentStyles.detailField;


  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

export default DetailField;
