import React, {useState, useEffect} from 'react';
import {View} from 'react-native';
import {useQuery} from '@apollo/client';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import SearchInput from 'shared/components/SearchInput';
import ClickableList from 'shared/components/ClickableList';
import NoResults from 'shared/components/NoResults';
import LoadingState from 'shared/components/LoadingState';
import {spacing} from 'shared/theme/tokens';
import {GET_EXERCISES} from 'modules/exercise/graphql/exercise.graphql';
import {Exercise} from 'modules/exercise/types/exercise.types';
import FilterPanel from 'shared/components/FilterPanel';
import {GET_FILTER_OPTIONS} from '../graphql/userWorkouts.graphql';
import {FilterOptions} from 'shared/components/FilterPanel';

export default function ExerciseLibraryScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, filters]);

  const {data, loading} = useQuery(GET_EXERCISES, {
    variables: {
      search: debouncedSearch,
      filters,
    },
  });

  const exercises = data?.getExercises ?? [];

  const {data: filterData} = useQuery(GET_FILTER_OPTIONS);

  const filterOptions: Record<string, FilterOptions> = filterData
    ? {
        type: filterData.allExerciseTypes.map((t: any) => String(t.name)),
        difficulty: filterData.allExerciseDifficulties.map((d: any) =>
          String(d.level),
        ),
        bodyPart: filterData.allBodyParts.map((b: any) => String(b.name)),
        muscle: Object.fromEntries(
          filterData.allBodyParts.map((b: any) => [
            String(b.name),
            b.muscles.map((m: any) => String(m.name)),
          ]),
        ),
      }
    : {
        type: [],
        difficulty: [],
        bodyPart: [],
        muscle: {},
      };

  return (
    <ScreenLayout scroll>
      <Title text="Exercise Library" />
      {filterData && (
        <FilterPanel
          options={filterOptions}
          onChangeFilters={rawFilters => {
            const {type, ...rest} = rawFilters;
            const filters = {
              ...rest,
              exerciseType: type, // remap "type" to "exerciseType"
            };
            setFilters(filters);
          }}
        />
      )}

      <View style={{marginTop: spacing.lg, gap: spacing.md}}>
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
