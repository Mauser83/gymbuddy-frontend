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
import {NamedFilterOptions} from 'shared/components/FilterPanel';
import {useNavigate} from 'react-router-native';

export default function ExerciseLibraryScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const navigate = useNavigate();

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

  const filterOptions: Record<string, NamedFilterOptions> = filterData
    ? {
        exerciseType: {
          label: 'Type',
          options: filterData.allExerciseTypes.map((t: any) => String(t.name)),
        },
        difficulty: {
          label: 'Difficulty',
          options: filterData.allExerciseDifficulties.map((d: any) =>
            String(d.level),
          ),
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
      }
    : {};

  return (
    <ScreenLayout scroll>
      <Title text="Exercise Library" />
      {filterData && (
        <FilterPanel
          options={filterOptions}
          onChangeFilters={filters => {
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
                navigate(`/user/exercise/${ex.id}`);
              },
            }))}
          />
        )}
      </View>
    </ScreenLayout>
  );
}
