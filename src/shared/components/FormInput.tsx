import React from 'react';
import { View, Text, TextInput } from 'react-native';

import { useTheme } from 'src/shared/theme/ThemeProvider';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?:
    | 'default'
    | 'email-address'
    | 'numeric'
    | 'phone-pad'
    | 'number-pad'
    | 'decimal-pad'
    | 'url'
    | 'name-phone-pad'
    | 'twitter'
    | 'web-search';
  returnKeyType?: 'done' | 'next';
  onSubmitEditing?: () => void;
  editable?: boolean;
  autoCorrect?: boolean;
  autoCapitalize?: 'sentences' | 'none' | 'words' | 'characters';
}

const FormInput = ({
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
  editable = true,
  autoCorrect = false,
  autoCapitalize = 'sentences',
}: FormInputProps) => {
  const { theme, componentStyles } = useTheme();
  const styles = componentStyles.formInput;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.field, error && styles.errorField, editable === false && { opacity: 0.5 }]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        editable={editable}
        autoCorrect={autoCorrect}
        autoCapitalize={autoCapitalize}
      />
      {error && <Text style={styles.errorMessage}>{error}</Text>}
    </View>
  );
};

export default FormInput;
