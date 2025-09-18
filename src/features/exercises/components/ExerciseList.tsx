import React, { memo } from 'react';
import { FlatList } from 'react-native';

import { Exercise } from 'src/features/exercises/types/exercise.types';
import ClickableList from 'src/shared/components/ClickableList';
import LoadingState from 'src/shared/components/LoadingState';
import NoResults from 'src/shared/components/NoResults';
import { spacing } from 'src/shared/theme/tokens';

interface ExerciseListProps {
  exercises: Exercise[];
  loading: boolean;
  ListHeaderComponent: React.ReactElement;
  onExercisePress: (exercise: Exercise) => void;
}

const ExerciseListComponent = ({
  exercises,
  loading,
  ListHeaderComponent,
  onExercisePress,
}: ExerciseListProps) => (
  <FlatList
    data={exercises}
    renderItem={({ item }) => (
      <ClickableList
        items={[
          {
            id: String(item.id),
            label: item.name,
            subLabel: item.description,
            onPress: () => onExercisePress(item),
          },
        ]}
      />
    )}
    keyExtractor={(item) => item.id.toString()}
    ListHeaderComponent={ListHeaderComponent}
    ListEmptyComponent={
      loading ? (
        <LoadingState text="Loading exercises..." />
      ) : (
        <NoResults message="No exercises found." />
      )
    }
    contentContainerStyle={{ padding: spacing.md }}
    keyboardShouldPersistTaps="handled"
  />
);

ExerciseListComponent.displayName = 'ExerciseList';

const ExerciseList = memo(ExerciseListComponent);

export default ExerciseList;
