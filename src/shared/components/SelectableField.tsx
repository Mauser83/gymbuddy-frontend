import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { useTheme } from '../theme/ThemeProvider';

interface SelectableFieldProps {
  label?: string;
  value: string;
  onPress: () => void;
  disabled?: boolean;
  expanded?: boolean;
}

const SelectableField = ({
  label,
  value,
  onPress,
  disabled = false,
  expanded = false,
}: SelectableFieldProps) => {
  const { componentStyles, theme } = useTheme();
  const styles = componentStyles.selectableField;

  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        onPress={disabled ? undefined : onPress}
        activeOpacity={disabled ? 1 : 0.8}
        style={[styles.picker, disabled && styles.pickerDisabled]}
      >
        <View style={styles.pickerContent}>
          <Text style={disabled ? styles.pickerTextDisabled : styles.pickerText}>{value}</Text>
          {!disabled && (
            <FontAwesome
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.colors.accentStart}
            />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default SelectableField;
