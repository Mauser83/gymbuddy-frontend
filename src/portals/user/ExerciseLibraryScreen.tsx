import { useLazyQuery, useQuery } from '@apollo/client';
import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { View } from 'react-native';
import { useNavigate } from 'react-router-native';

import ExerciseList from 'src/features/exercises/components/ExerciseList';
import { GET_EXERCISES } from 'src/features/exercises/graphql/exercise.graphql';
import { Exercise } from 'src/features/exercises/types/exercise.types';
import { GET_FILTER_OPTIONS } from 'src/features/workout-sessions/graphql/userWorkouts.graphql';
import FilterPanel, { NamedFilterOptions } from 'src/shared/components/FilterPanel';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import SearchInput from 'src/shared/components/SearchInput';
import Title from 'src/shared/components/Title';
import { spacing } from 'src/shared/theme/tokens';
import { debounce } from 'src/shared/utils/helpers';

// --- Step 1: Define the Props interface for the header ---
interface MemoizedListHeaderProps {
  filterData: any;
  filterOptions: Record<string, NamedFilterOptions>;
  onFilterChange: (filters: Record<string, string[]>) => void;
  search: string;
  onSearchChange: (text: string) => void;
}

// --- Step 2: Create a memoized header component with defined props ---
const ListHeaderComponent = ({
  filterData,
  filterOptions,
  onFilterChange,
  search,
  onSearchChange,
}: MemoizedListHeaderProps) => {
  return (
    <>
      <Title text="Exercise Library" />
      {filterData && <FilterPanel options={filterOptions} onChangeFilters={onFilterChange} />}
      <View style={{ marginTop: spacing.lg }}>
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search exercises"
          onClear={() => onSearchChange('')}
        />
      </View>
    </>
  );
};

ListHeaderComponent.displayName = 'ExerciseLibraryListHeader';

const MemoizedListHeader = memo(ListHeaderComponent);

export default function ExerciseLibraryScreen() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const navigate = useNavigate();

  // --- Step 3: Stabilize all props that will be passed to the header ---
  const handleFilterChange = useCallback((newFilters: Record<string, string[]>) => {
    setFilters(newFilters);
  }, []);

  const [fetchExercises, { data, loading }] = useLazyQuery(GET_EXERCISES, {
    fetchPolicy: 'cache-and-network',
  });
  const exercises: Exercise[] = data?.getExercises ?? [];

  const debouncedFetch = useMemo(
    () =>
      debounce((q: string) => {
        fetchExercises({ variables: { search: q || undefined, filters } });
      }, 500),
    [fetchExercises, filters],
  );

  useEffect(() => {
    debouncedFetch(search);
  }, [search, debouncedFetch]);

  useEffect(() => {
    fetchExercises({ variables: { search: search || undefined, filters } });
  }, [filters, fetchExercises, search]);

  const { data: filterData } = useQuery(GET_FILTER_OPTIONS);

  const filterOptions = useMemo(() => {
    if (!filterData) {
      // Return a valid, empty-structured object to satisfy TypeScript
      return {
        exerciseType: { label: 'Type', options: [] },
        difficulty: { label: 'Difficulty', options: [] },
        bodyPart: { label: 'Body Part', options: [] },
        muscle: { label: 'Muscle', options: {} },
      };
    }
    return {
      exerciseType: {
        label: 'Type',
        options: filterData.allExerciseTypes.map((t: any) => String(t.name)),
      },
      difficulty: {
        label: 'Difficulty',
        options: filterData.allExerciseDifficulties.map((d: any) => String(d.level)),
      },
      bodyPart: {
        label: 'Body Part',
        options: filterData.allBodyParts.map((b: any) => String(b.name)),
      },
      muscle: {
        label: 'Muscle',
        options: Object.fromEntries(
          filterData.allBodyParts.map((b: any) => [
            String(b.name),
            b.muscles.map((m: any) => String(m.name)),
          ]),
        ),
      },
    };
  }, [filterData]);

  const handleExercisePress = useCallback(
    (exercise: Exercise) => navigate(`/user/exercise/${exercise.id}`),
    [navigate],
  );

  return (
    <ScreenLayout>
      <ExerciseList
        exercises={exercises}
        loading={loading}
        ListHeaderComponent={
          <MemoizedListHeader
            filterData={filterData}
            filterOptions={filterOptions}
            onFilterChange={handleFilterChange}
            search={search}
            onSearchChange={setSearch}
          />
        }
        onExercisePress={handleExercisePress}
      />
    </ScreenLayout>
  );
}
