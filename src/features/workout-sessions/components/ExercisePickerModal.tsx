import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';

import ModalWrapper from '../../../shared/components/ModalWrapper';
import Title from 'shared/components/Title';
import SearchInput from 'shared/components/SearchInput';
import ClickableListItem from 'shared/components/ClickableListItem';
import NoResults from 'shared/components/NoResults';

interface Exercise {
  id: number;
  name: string;
  description?: string;
}

interface ExercisePickerModalProps {
  visible: boolean;
  exercises: Exercise[];
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

export default function ExercisePickerModal({
  visible,
  exercises,
  onClose,
  onSelect,
}: ExercisePickerModalProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(debouncedSearch.toLowerCase().trim())
  );

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <Title text="Select Exercise" />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search exercises"
        onClear={() => setSearch('')}
      />

      <ScrollView style={{ height: 500 }}>
        {filteredExercises.length === 0 ? (
          <NoResults message="No matching exercises found." />
        ) : (
          filteredExercises.map(ex => (
            <ClickableListItem
              key={ex.id}
              label={ex.name}
              onPress={() => {
                onSelect(ex);
                onClose();
              }}
            />
          ))
        )}
      </ScrollView>
    </ModalWrapper>
  );
}
