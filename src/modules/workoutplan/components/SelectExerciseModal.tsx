import React, {useState} from 'react';
import {ScrollView, View} from 'react-native';
import Title from 'shared/components/Title';
import OptionItem from 'shared/components/OptionItem';
import Button from 'shared/components/Button';
import ButtonRow from 'shared/components/ButtonRow';
import { spacing } from 'shared/theme/tokens';

type Exercise = {
  id: number;
  name: string;
  primaryMuscles: {bodyPartId: number}[];
};

type SelectableExercise = {
  id: number;
  name: string;
};

interface Props {
  onClose: () => void;
  onSelect: (exercises: SelectableExercise[]) => void;
  filteredExercises: Exercise[];
}

export default function SelectExerciseModal({
  onClose,
  onSelect,
  filteredExercises,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
    );
  };

  const handleConfirm = () => {
    const selected = filteredExercises
      .filter(ex => selectedIds.includes(ex.id))
      .map(ex => ({
        id: ex.id,
        name: ex.name,
      }));
    onSelect(selected);
    onClose();
    setSelectedIds([]);
  };

  return (
    <>
      <Title text="Select Exercises" />
      <ScrollView style={{maxHeight: 500}}>
        {filteredExercises.map(ex => {
          const selected = selectedIds.includes(ex.id);
          return (
            <OptionItem
              key={ex.id}
              text={ex.name}
              selected={selected}
              onPress={() => toggleSelect(ex.id)}
            />
          );
        })}
      </ScrollView>
                          <View style={{marginTop: spacing.md}}>
      
      <ButtonRow>
        <Button text="Cancel" fullWidth onPress={onClose} />
        <Button
          text="Add"
          fullWidth
          onPress={handleConfirm}
          disabled={selectedIds.length === 0}
        />
      </ButtonRow>
      </View>
    </>
  );
}
