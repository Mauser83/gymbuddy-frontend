import React from 'react';
import { ScrollView, View } from 'react-native';

import Button from 'src/shared/components/Button';
import OptionItem from 'src/shared/components/OptionItem';
import Title from 'src/shared/components/Title';
import { useTheme } from 'src/shared/theme/ThemeProvider';
import { spacing } from 'src/shared/theme/tokens';

interface TrainingMethodPickerProps {
  trainingMethods: { id: number; name: string }[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onClose: () => void;
}

export default function TrainingMethodPicker({
  trainingMethods,
  selectedId,
  onSelect,
  onClose,
}: TrainingMethodPickerProps) {
  const { theme } = useTheme();

  return (
    <>
      <Title text="Select Training Method" />
      <ScrollView>
        {trainingMethods
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((method) => (
            <OptionItem
              key={method.id}
              text={method.name}
              selected={selectedId === method.id}
              onPress={() => onSelect(method.id)}
            />
          ))}
      </ScrollView>
      <View style={{ marginTop: spacing.md }}>
        <Button text="Close" onPress={onClose} />
      </View>
    </>
  );
}
