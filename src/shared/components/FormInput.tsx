import React from 'react';
import {View, Text, TextInput} from 'react-native';
import {useTheme} from 'shared/theme/ThemeProvider';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  returnKeyType?: 'done' | 'next';
  onSubmitEditing?: () => void;
  editable?: boolean;
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
}: FormInputProps) => {
  const {theme, componentStyles} = useTheme();
  const styles = componentStyles.formInput;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.field,
          error && styles.errorField,
          editable === false && {opacity: 0.5},
        ]}
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
      />
      {error && <Text style={styles.errorMessage}>{error}</Text>}
    </View>
  );
};

export default FormInput;
