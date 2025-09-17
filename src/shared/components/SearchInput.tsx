import React from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';

import { useTheme } from 'shared/theme/ThemeProvider';

interface SearchInputProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

const SearchInput = ({ value, onChange, placeholder = 'Search...', onClear }: SearchInputProps) => {
  const { theme, componentStyles } = useTheme();
  const styles = componentStyles.searchInput;

  return (
    <View style={styles.searchContainer}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={onChange}
        style={styles.input}
      />
      {value.length > 0 && onClear && (
        <TouchableOpacity style={styles.clearButton} onPress={onClear}>
          <Text style={styles.clearButtonText}>✖</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchInput;
