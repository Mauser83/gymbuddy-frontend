import React from 'react';
import {TouchableOpacity, Text} from 'react-native';
import {useTheme} from 'shared/theme/ThemeProvider';
import {borderWidth, spacing} from 'shared/theme/tokens';

interface OptionItemProps {
  text: string;
  onPress: () => void;
  onLongPress?: () => void; // ✅ Add this line
  selected?: boolean;
}

const OptionItem = ({
  text,
  onPress,
  onLongPress,
  selected = false,
}: OptionItemProps) => {
  const {componentStyles, theme} = useTheme();
  const styles = componentStyles.optionItem;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress} // ✅ Pass it through
      delayLongPress={5000}
      style={[
        selected
          ? {
              paddingVertical: spacing.md,
              borderWidth: borderWidth.thick,
              borderColor: theme.colors.accentStart,
              borderRadius: 12,
            }
          : {
              paddingVertical: spacing.md,
              borderBottomColor: theme.colors.divider,
              borderBottomWidth: borderWidth.hairline,
            },
      ]}>
      <Text style={[styles.text, selected && {fontWeight: 'bold'}]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

export default OptionItem;
