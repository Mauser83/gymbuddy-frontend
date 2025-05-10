import React from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {useTheme} from 'shared/theme/ThemeProvider';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  returnKeyType?: 'done' | 'next';
  onSubmitEditing?: () => void;
}

const Input = ({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  error,
  secureTextEntry,
  keyboardType = 'default',
  returnKeyType = 'done',
  onSubmitEditing,
}: InputProps) => {
  const {theme, componentStyles} = useTheme();
  const styles = componentStyles.input;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.field, error && styles.errorField]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
      />
      {error && <Text style={styles.errorMessage}>{error}</Text>}
    </View>
  );
};

export default Input;
