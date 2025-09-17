import React from 'react';
import { ScrollView, View } from 'react-native';

import type { MuscleGroup } from 'src/features/exercises/components/EditMuscleGroupModal';
import Button from 'src/shared/components/Button';
import OptionItem from 'src/shared/components/OptionItem';
import Title from 'src/shared/components/Title';
import { spacing } from 'src/shared/theme/tokens';

interface Props {
  muscleGroups: MuscleGroup[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  onClose: () => void;
  onRefetch: () => Promise<any>;
}

export default function MuscleGroupPickerModal({
  muscleGroups,
  selectedIds,
  onChange,
  onClose,
  onRefetch,
}: Props) {
  const toggleSelection = (id: number) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id];
    onChange(newIds);
  };

  return (
    <>
      <Title text="Select Muscle Groups" />
      <ScrollView style={{ maxHeight: 400 }}>
        {muscleGroups
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((group) => (
            <OptionItem
              key={group.id}
              text={group.name}
              selected={selectedIds.includes(group.id)}
              onPress={() => toggleSelection(group.id)}
            />
          ))}
      </ScrollView>

      <View style={{ marginTop: spacing.md }}>
        <Button text="Close" onPress={onClose} />
      </View>
    </>
  );
}
