import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
import { useQuery } from '@apollo/client';

import Title from 'shared/components/Title';
import SearchInput from 'shared/components/SearchInput';
import NoResults from 'shared/components/NoResults';
import ClickableListItem from 'shared/components/ClickableListItem';

import { GET_WORKOUT_PLANS } from '../graphql/userWorkouts.graphql';

export interface WorkoutPlan {
  id: number;
  name: string;
  description?: string;
}

interface WorkoutPlanPickerModalProps {
  onClose: () => void;
  onSelect: (plan: WorkoutPlan) => void;
}

export default function WorkoutPlanPickerModal({
  onClose,
  onSelect,
}: WorkoutPlanPickerModalProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data, loading } = useQuery(GET_WORKOUT_PLANS, {
    variables: { search: debouncedSearch },
  });

  const plans: WorkoutPlan[] = data?.workoutPlans ?? [];

  const filteredPlans = plans.filter(plan => {
    const term = debouncedSearch.toLowerCase().trim();
    return (
      plan.name.toLowerCase().includes(term) ||
      plan.description?.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <Title text="Select Workout Plan" />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search workout plans"
        onClear={() => setSearch('')}
      />

      <ScrollView style={{ height: 500 }}>
        {!loading && filteredPlans.length === 0 ? (
          <NoResults message="No plans found." />
        ) : (
          filteredPlans.map(plan => (
            <ClickableListItem
              key={plan.id}
              label={plan.name}
              subLabel={plan.description || undefined}
              onPress={() => {
                onSelect(plan);
                onClose();
              }}
            />
          ))
        )}
      </ScrollView>
    </>
  );
}
