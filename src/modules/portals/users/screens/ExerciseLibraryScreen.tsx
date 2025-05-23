import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useQuery } from '@apollo/client';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import SearchInput from 'shared/components/SearchInput';
import ClickableList from 'shared/components/ClickableList';
import NoResults from 'shared/components/NoResults';
import LoadingState from 'shared/components/LoadingState';
import { spacing } from 'shared/theme/tokens';
import { GET_EXERCISES } from 'modules/exercise/graphql/exercise.graphql';
import { Exercise } from 'modules/exercise/types/exercise.types';
import FilterPanel from 'shared/components/FilterPanel';

export default function ExerciseLibraryScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data, loading } = useQuery(GET_EXERCISES, {
    variables: { search: debouncedSearch },
  });

  const exercises = data?.getExercises ?? [];

  return (
    <ScreenLayout scroll>
      <Title text="Exercise Library" />
      <FilterPanel onChangeFilters={(filters) => console.log('Active filters:', filters)} />


      <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search exercises"
          onClear={() => setSearch('')}
        />

        {loading ? (
          <LoadingState text="Loading exercises..." />
        ) : exercises.length === 0 ? (
          <NoResults message="No exercises found." />
        ) : (
          <ClickableList
            items={exercises.map((ex: Exercise) => ({
              id: String(ex.id),
              label: ex.name,
              subLabel: ex.description,
              onPress: () => {
                // Navigate to detail screen later
                console.log('Go to detail for', ex.name);
              },
            }))}
          />
        )}
      </View>
    </ScreenLayout>
  );
}
