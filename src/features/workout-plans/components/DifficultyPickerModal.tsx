import React from 'react';
import { ScrollView, View } from 'react-native';

import Button from 'shared/components/Button';
import OptionItem from 'shared/components/OptionItem';
import Title from 'shared/components/Title';
import { useTheme } from 'shared/theme/ThemeProvider';
import { spacing } from 'shared/theme/tokens';

interface DifficultyPickerModalProps {
  visible: boolean;
  selectedId: number | null;
  levels: { id: number; name: string; key: string }[];
  onSelect: (levelId: number) => void;
  onClose: () => void;
}

const experienceLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

export default function DifficultyPickerModal({
  visible,
  selectedId,
  levels,
  onSelect,
  onClose,
}: DifficultyPickerModalProps) {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <>
      <Title text="Select Planned Difficulty" />
      <ScrollView>
        {levels.map((level) => (
          <OptionItem
            key={level.id}
            text={level.name}
            selected={selectedId === level.id}
            onPress={() => onSelect(level.id)}
          />
        ))}
      </ScrollView>
      <View style={{ marginTop: spacing.md }}>
        <Button text="Close" onPress={onClose} />
      </View>
    </>
  );
}
