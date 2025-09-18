import React from 'react';
import { ScrollView, View } from 'react-native';

import Button from 'src/shared/components/Button';
import OptionItem from 'src/shared/components/OptionItem';
import Title from 'src/shared/components/Title';
import { spacing } from 'src/shared/theme/tokens';

interface DifficultyPickerModalProps {
  visible: boolean;
  selectedId: number | null;
  levels: { id: number; name: string; key: string }[];
  onSelect: (levelId: number) => void;
  onClose: () => void;
}

export default function DifficultyPickerModal({
  visible,
  selectedId,
  levels,
  onSelect,
  onClose,
}: DifficultyPickerModalProps) {
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
