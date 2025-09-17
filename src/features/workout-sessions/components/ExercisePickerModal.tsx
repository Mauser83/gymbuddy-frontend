import React, { useState, useEffect, useMemo } from 'react';
import { ScrollView } from 'react-native';

import ClickableListItem from 'shared/components/ClickableListItem';
import DividerWithLabel from 'shared/components/DividerWithLabel';
import NoResults from 'shared/components/NoResults';
import SearchInput from 'shared/components/SearchInput';
import Title from 'shared/components/Title';

import ModalWrapper from '../../../shared/components/ModalWrapper';

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
  planExerciseIds?: number[];
}

export default function ExercisePickerModal({
  visible,
  exercises,
  onClose,
  onSelect,
  planExerciseIds,
}: ExercisePickerModalProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const planIds = useMemo(() => new Set(planExerciseIds ?? []), [planExerciseIds]);

  const { planExercises, otherExercises } = useMemo(() => {
    const lower = debouncedSearch.toLowerCase().trim();
    const plan: Exercise[] = [];
    const others: Exercise[] = [];

    exercises.forEach((ex) => {
      if (!ex.name.toLowerCase().includes(lower)) return;
      if (planIds.has(ex.id)) plan.push(ex);
      else others.push(ex);
    });

    plan.sort((a, b) => a.name.localeCompare(b.name));
    others.sort((a, b) => a.name.localeCompare(b.name));

    return { planExercises: plan, otherExercises: others };
  }, [exercises, debouncedSearch, planIds]);

  const hasPlan = planIds.size > 0;

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
        {planExercises.length === 0 && otherExercises.length === 0 ? (
          <NoResults message="No matching exercises found." />
        ) : hasPlan ? (
          <>
            {planExercises.length > 0 && (
              <>
                <DividerWithLabel label="In workout plan" />
                {planExercises.map((ex) => (
                  <ClickableListItem
                    key={ex.id}
                    label={ex.name}
                    onPress={() => {
                      onSelect(ex);
                      onClose();
                    }}
                  />
                ))}
              </>
            )}
            {otherExercises.length > 0 && (
              <>
                <DividerWithLabel label="Other exercises" />
                {otherExercises.map((ex) => (
                  <ClickableListItem
                    key={ex.id}
                    label={ex.name}
                    onPress={() => {
                      onSelect(ex);
                      onClose();
                    }}
                  />
                ))}
              </>
            )}
          </>
        ) : (
          otherExercises.map((ex) => (
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
