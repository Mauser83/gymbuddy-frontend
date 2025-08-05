import React from 'react';
import {FlatList} from 'react-native';
import ClickableList from 'shared/components/ClickableList';
import NoResults from 'shared/components/NoResults';
import LoadingState from 'shared/components/LoadingState';
import {Exercise} from 'features/exercises/types/exercise.types';
import {spacing} from 'shared/theme/tokens';

interface ExerciseListProps {
  exercises: Exercise[];
  loading: boolean;
  ListHeaderComponent: React.ReactElement;
  onExercisePress: (exercise: Exercise) => void;
}

const ExerciseList = React.memo(({exercises, loading, ListHeaderComponent, onExercisePress}: ExerciseListProps) => (
  <FlatList
    data={exercises}
    renderItem={({item}) => (
      <ClickableList
        items={[{
          id: String(item.id),
          label: item.name,
          subLabel: item.description,
          onPress: () => onExercisePress(item),
        }]}
      />
    )}
    keyExtractor={item => item.id.toString()}
    ListHeaderComponent={ListHeaderComponent}
    ListEmptyComponent={
      loading ? <LoadingState text="Loading exercises..." /> : <NoResults message="No exercises found." />
    }
    contentContainerStyle={{padding: spacing.md}}
    keyboardShouldPersistTaps="handled"
  />
));

export default ExerciseList;