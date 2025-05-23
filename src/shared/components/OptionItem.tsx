import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useTheme } from 'shared/theme/ThemeProvider';

interface OptionItemProps {
  text: string;
  onPress: () => void;
  selected?: boolean;
}

const OptionItem = ({ text, onPress, selected = false }: OptionItemProps) => {
  const { componentStyles } = useTheme();
  const styles = componentStyles.optionItem;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        selected && {
          // backgroundColor: styles.container.backgroundColor ?? '#FFF3E0',
          borderColor: styles.text.color ?? '#FFA726',
          borderWidth: 2,
        },
      ]}
    >
      <Text style={[styles.text, selected && { fontWeight: 'bold' }]}>
        {selected ? `✔️ ${text}` : text}
      </Text>
    </TouchableOpacity>
  );
};

export default OptionItem;
