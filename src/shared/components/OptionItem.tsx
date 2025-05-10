import React from 'react';
import {TouchableOpacity, Text} from 'react-native';
import {useTheme} from 'shared/theme/ThemeProvider';

interface OptionItemProps {
  text: string;
  onPress: () => void;
}

const OptionItem = ({text, onPress}: OptionItemProps) => {
  const {componentStyles} = useTheme();
  const styles = componentStyles.optionItem;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
};

export default OptionItem;
