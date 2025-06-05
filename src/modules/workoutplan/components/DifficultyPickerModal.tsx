import React from 'react';
import {ScrollView, View} from 'react-native';
import Title from 'shared/components/Title';
import OptionItem from 'shared/components/OptionItem';
import Button from 'shared/components/Button';
import {spacing} from 'shared/theme/tokens';
import {useTheme} from 'shared/theme/ThemeProvider';

interface DifficultyPickerModalProps {
  visible: boolean;
  selectedLevel: string;
  onSelect: (level: string) => void;
  onClose: () => void;
}

const experienceLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

export default function DifficultyPickerModal({
  visible,
  selectedLevel,
  onSelect,
  onClose,
}: DifficultyPickerModalProps) {
  const {theme} = useTheme();

  if (!visible) return null;

  return (
    <>
      <Title text="Select Planned Difficulty" />
      <ScrollView>
        {experienceLevels.map(level => (
          <OptionItem
            key={level}
            text={level.charAt(0) + level.slice(1).toLowerCase()}
            selected={selectedLevel === level}
            onPress={() => onSelect(level)}
          />
        ))}
      </ScrollView>
      <View style={{marginTop: spacing.md}}>
        <Button text="Close" onPress={onClose} />
      </View>
    </>
  );
}
