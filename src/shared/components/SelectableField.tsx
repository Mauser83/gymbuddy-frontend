import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useTheme} from '../theme/ThemeProvider';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

interface SelectableFieldProps {
  label: string;
  value: string;
  onPress: () => void;
  disabled?: boolean;
}

const SelectableField = ({
  label,
  value,
  onPress,
  disabled = false,
}: SelectableFieldProps) => {
  const {componentStyles, theme} = useTheme();
  const styles = componentStyles.selectableField;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        onPress={disabled ? undefined : onPress}
        activeOpacity={disabled ? 1 : 0.8}
        style={[styles.picker, disabled && styles.pickerDisabled]}>
        <View style={styles.pickerContent}>
          <Text
            style={disabled ? styles.pickerTextDisabled : styles.pickerText}>
            {value}
          </Text>
          {!disabled && (
            <FontAwesome
              name="chevron-down"
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
