import React from 'react';
import {View, Text} from 'react-native';
import {useTheme} from 'shared/theme/ThemeProvider';

interface DividerWithLabelProps {
  label: string;
}

const DividerWithLabel = ({label}: DividerWithLabelProps) => {
  const {componentStyles} = useTheme();
  const styles = componentStyles.divider;

  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
};

export default DividerWithLabel;