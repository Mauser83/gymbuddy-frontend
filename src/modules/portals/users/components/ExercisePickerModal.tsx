import React, {useState, useEffect} from 'react';
import {View, Dimensions} from 'react-native';
import {useQuery} from '@apollo/client';
import ModalWrapper from '../../../../shared/components/ModalWrapper';
import SearchInput from '../../../../shared/components/SearchInput';
import ClickableList from '../../../../shared/components/ClickableList';
import NoResults from '../../../../shared/components/NoResults';
import {GET_EXERCISES_AVAILABLE_AT_GYM} from '../graphql/userWorkouts.graphql';
import {spacing} from '../../../../shared/theme/tokens';

interface Exercise {
  id: number;
  name: string;
  description?: string;
}

interface ExerciseWithSlots {
  id: number;
  name: string;
  description?: string;
  equipmentSlots?: {
    options: {
      subcategory: {
        id: number;
      };
    }[];
  }[];
}

interface ExercisePickerModalProps {
  visible: boolean;
  gymId?: number | null;
  onClose: () => void;
  onSelect: (exercise: ExerciseWithSlots) => void;
}

const modalHeight = Dimensions.get('window').height * 0.8;

export default function ExercisePickerModal({
  visible,
  gymId,
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

  const {data, loading} = useQuery(GET_EXERCISES_AVAILABLE_AT_GYM, {
    variables: {gymId, search: debouncedSearch},
    skip: !gymId,
  });

  const exercises: ExerciseWithSlots[] = data?.exercisesAvailableAtGym ?? [];

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <View style={{padding: spacing.md, gap: spacing.md, height: modalHeight}}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search exercises"
          onClear={() => setSearch('')}
        />

        {!loading && exercises.length === 0 ? (
          <NoResults message="No exercises found." />
        ) : (
          <ClickableList
            items={(exercises as ExerciseWithSlots[]).map(exercise => ({
              id: String(exercise.id),
              label: exercise.name,
              subLabel: exercise.description || undefined,
              onPress: () => {
                onSelect({
                  id: exercise.id,
                  name: exercise.name,
                  equipmentSlots: exercise.equipmentSlots ?? [], // ✅ ensure this is passed
                });
                onClose();
              },
            }))}
          />
        )}
      </View>
    </ModalWrapper>
  );
}
