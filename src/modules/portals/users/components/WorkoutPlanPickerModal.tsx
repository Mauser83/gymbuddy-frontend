import React, { useState, useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import { useQuery } from '@apollo/client';
import ModalWrapper from '../../../../shared/components/ModalWrapper';
import SearchInput from '../../../../shared/components/SearchInput';
import ClickableList from '../../../../shared/components/ClickableList';
import NoResults from '../../../../shared/components/NoResults';
import { GET_WORKOUT_PLANS } from '../graphql/userWorkouts.graphql';
import { spacing } from '../../../../shared/theme/tokens';

interface WorkoutPlan {
  id: number;
  name: string;
  description?: string;
}

interface WorkoutPlanPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (plan: WorkoutPlan) => void;
}

const modalHeight = Dimensions.get('window').height * 0.8;

export default function WorkoutPlanPickerModal({ visible, onClose, onSelect }: WorkoutPlanPickerModalProps) {
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

  const plans: WorkoutPlan[] = data?.workouts ?? [];

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <View style={{ padding: spacing.md, gap: spacing.md, height: modalHeight }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search workout plans"
          onClear={() => setSearch('')}
        />

        {!loading && plans.length === 0 ? (
          <NoResults message="No plans found." />
        ) : (
          <ClickableList
            items={plans.map((plan) => ({
              id: String(plan.id),
              label: plan.name,
              subLabel: plan.description || '',
              onPress: () => {
                onSelect(plan);
                onClose();
              },
            }))}
          />
        )}
      </View>
    </ModalWrapper>
  );
}
