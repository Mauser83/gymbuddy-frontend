import React, {useState, useEffect} from 'react';
import {View, Dimensions} from 'react-native';
import ModalWrapper from '../../../../shared/components/ModalWrapper';
import SearchInput from '../../../../shared/components/SearchInput';
import ClickableList from '../../../../shared/components/ClickableList';
import NoResults from '../../../../shared/components/NoResults';
import {spacing} from '../../../../shared/theme/tokens';

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

const modalHeight = Dimensions.get('window').height * 0.8;

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

  const visibleExerciseList = exercises.filter((ex: Exercise) =>
    ex.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <View style={{padding: spacing.md, gap: spacing.md, height: modalHeight}}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search exercises"
          onClear={() => setSearch('')}
        />
        {visibleExerciseList.length === 0 ? (
          <NoResults message="No matching exercises found." />
        ) : (
          <ClickableList
            items={visibleExerciseList.map(ex => ({
              id: String(ex.id),
              label: ex.name,
              subLabel: ex.description,
              onPress: () => {
                onSelect(ex);
                onClose();
              },
            }))}
          />
        )}
      </View>
    </ModalWrapper>
  );
}
