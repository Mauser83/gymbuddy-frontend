import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {View, FlatList} from 'react-native';
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
import FilterPanel, {NamedFilterOptions} from 'shared/components/FilterPanel';
import {GET_FILTER_OPTIONS} from '../graphql/userWorkouts.graphql';
import {useNavigate} from 'react-router-native';

// --- Step 1: Define the Props interface for the header ---
interface MemoizedListHeaderProps {
  filterData: any;
  filterOptions: Record<string, NamedFilterOptions>;
  onFilterChange: (filters: Record<string, string[]>) => void;
  search: string;
  onSearchChange: (text: string) => void;
}

// --- Step 2: Create a memoized header component with defined props ---
const MemoizedListHeader = React.memo(({
  filterData,
  filterOptions,
  onFilterChange,
  search,
  onSearchChange,
}: MemoizedListHeaderProps) => {
    return (
        <>
            <Title text="Exercise Library" />
            {filterData && (
                <FilterPanel
                    options={filterOptions}
                    onChangeFilters={onFilterChange}
                />
            )}
            <View style={{marginTop: spacing.lg}}>
                <SearchInput
                    value={search}
                    onChange={onSearchChange}
                    placeholder="Search exercises"
                    onClear={() => onSearchChange('')}
                />
            </View>
        </>
    );
});


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
  }, [search]);
  
  // --- Step 3: Stabilize all props that will be passed to the header ---
  const handleFilterChange = useCallback((newFilters: Record<string, string[]>) => {
    setFilters(newFilters);
  }, []);

  const {data, loading} = useQuery(GET_EXERCISES, {
    variables: { search: debouncedSearch, filters },
  });
  const exercises = data?.getExercises ?? [];

  const {data: filterData} = useQuery(GET_FILTER_OPTIONS);
  
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
      exerciseType: { label: 'Type', options: filterData.allExerciseTypes.map((t: any) => String(t.name)) },
      difficulty: { label: 'Difficulty', options: filterData.allExerciseDifficulties.map((d: any) => String(d.level))},
      bodyPart: { label: 'Body Part', options: filterData.allBodyParts.map((b: any) => String(b.name)) },
      muscle: { label: 'Muscle', options: Object.fromEntries(filterData.allBodyParts.map((b: any) => [String(b.name), b.muscles.map((m: any) => String(m.name))]))},
    };
  }, [filterData]);

  const renderItem = ({item}: {item: Exercise}) => (
    <ClickableList
      items={[{
          id: String(item.id),
          label: item.name,
          subLabel: item.description,
          onPress: () => navigate(`/user/exercise/${item.id}`),
      }]}
    />
  );

  return (
    <ScreenLayout>
      <FlatList
        data={exercises}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        // --- Step 4: Render the memoized header with stable props ---
        ListHeaderComponent={
            <MemoizedListHeader
                filterData={filterData}
                filterOptions={filterOptions}
                onFilterChange={handleFilterChange}
                search={search}
                onSearchChange={setSearch}
            />
        }
        ListEmptyComponent={
            loading ? <LoadingState text="Loading exercises..." /> : <NoResults message="No exercises found." />
        }
        contentContainerStyle={{padding: spacing.md}}
        keyboardShouldPersistTaps="handled"
      />
    </ScreenLayout>
  );
}
