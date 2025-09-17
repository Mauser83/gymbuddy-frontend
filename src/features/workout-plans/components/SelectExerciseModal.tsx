import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';

import Button from 'src/shared/components/Button';
import ButtonRow from 'src/shared/components/ButtonRow';
import NoResults from 'src/shared/components/NoResults';
import OptionItem from 'src/shared/components/OptionItem';
import SearchInput from 'src/shared/components/SearchInput';
import Title from 'src/shared/components/Title';
import { spacing } from 'src/shared/theme/tokens';

type Exercise = {
  id: number;
  name: string;
  primaryMuscles: {
    bodyPart?: { name: string };
  }[];
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

export default function SelectExerciseModal({ onClose, onSelect, filteredExercises }: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');

  const lowerSearch = search.toLowerCase().trim();

  const searchFiltered = filteredExercises.filter((ex) => {
    const nameMatch = ex.name.toLowerCase().includes(lowerSearch);
    const bodyPartMatch = ex.primaryMuscles?.some((m) =>
      m.bodyPart?.name?.toLowerCase().includes(lowerSearch),
    );
    return nameMatch || bodyPartMatch;
  });

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleConfirm = () => {
    const selected = filteredExercises
      .filter((ex) => selectedIds.includes(ex.id))
      .map((ex) => ({
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
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search exercises or body parts"
        onClear={() => setSearch('')}
      />
      <ScrollView style={{ maxHeight: 500 }}>
        {searchFiltered.length > 0 ? (
          searchFiltered.map((ex) => {
            const selected = selectedIds.includes(ex.id);
            return (
              <OptionItem
                key={ex.id}
                text={ex.name}
                selected={selected}
                onPress={() => toggleSelect(ex.id)}
              />
            );
          })
        ) : (
          <NoResults message="No exercises found" />
        )}
      </ScrollView>
      <View style={{ marginTop: spacing.md }}>
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
