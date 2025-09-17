import { useLazyQuery } from '@apollo/client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';

import SearchInput from 'shared/components/SearchInput';
import Title from 'shared/components/Title';
import { debounce } from 'shared/utils/helpers';

import WorkoutPlanList from './WorkoutPlanList';
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

export default function WorkoutPlanPickerModal({ onClose, onSelect }: WorkoutPlanPickerModalProps) {
  const [search, setSearch] = useState('');

  const [fetchPlans, { data, loading }] = useLazyQuery(GET_WORKOUT_PLANS);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const debouncedFetch = useMemo(
    () =>
      debounce((q: string) => {
        fetchPlans({ variables: { search: q || undefined } });
      }, 500),
    [fetchPlans],
  );

  useEffect(() => {
    debouncedFetch(search);
  }, [search, debouncedFetch]);

  const plans: WorkoutPlan[] = data?.workoutPlans ?? [];

  const handleSelect = useCallback(
    (plan: WorkoutPlan) => {
      onSelect(plan);
      onClose();
    },
    [onSelect, onClose],
  );

  return (
    <>
      <Title text="Select Workout Plan" />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search workout plans"
        onClear={() => setSearch('')}
      />

      <WorkoutPlanList plans={plans} loading={loading} onSelect={handleSelect} />
    </>
  );
}
