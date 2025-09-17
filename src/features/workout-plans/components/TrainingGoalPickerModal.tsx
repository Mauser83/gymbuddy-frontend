import React from 'react';
import { ScrollView, View } from 'react-native';

import Button from 'src/shared/components/Button';
import OptionItem from 'src/shared/components/OptionItem';
import Title from 'src/shared/components/Title';
import { spacing } from 'src/shared/theme/tokens';

interface Props {
  visible: boolean;
  trainingGoals: { id: number; name: string }[];
  selectedId?: number;
  onSelect: (id: number) => void;
  onClose: () => void;
}

export default function TrainingGoalPickerModal({
  visible,
  trainingGoals,
  selectedId,
  onSelect,
  onClose,
}: Props) {
  return (
    <>
      <Title text="Select Training Goal" />
      <ScrollView>
        {trainingGoals
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((goal) => (
            <OptionItem
              key={goal.id}
              text={goal.name}
              selected={goal.id === selectedId}
              onPress={() => onSelect(goal.id)}
            />
          ))}
      </ScrollView>

      <View style={{ marginTop: spacing.md }}>
        <Button text="Close" onPress={onClose} />
      </View>
    </>
  );
}
