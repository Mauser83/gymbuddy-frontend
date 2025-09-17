import React, { memo } from 'react';
import { ScrollView } from 'react-native';

import ClickableListItem from 'src/shared/components/ClickableListItem';
import NoResults from 'src/shared/components/NoResults';

import { WorkoutPlan } from './WorkoutPlanPickerModal';

interface WorkoutPlanListProps {
  plans: WorkoutPlan[];
  loading: boolean;
  onSelect: (plan: WorkoutPlan) => void;
}

const WorkoutPlanListComponent: React.FC<WorkoutPlanListProps> = ({ plans, loading, onSelect }) => (
  <ScrollView style={{ height: 500 }}>
    {!loading && plans.length === 0 ? (
      <NoResults message="No plans found." />
    ) : (
      plans.map((plan) => (
        <ClickableListItem
          key={plan.id}
          label={plan.name}
          subLabel={plan.description || undefined}
          onPress={() => onSelect(plan)}
        />
      ))
    )}
  </ScrollView>
);

const WorkoutPlanList = memo(WorkoutPlanListComponent);
WorkoutPlanList.displayName = 'WorkoutPlanList';

export default WorkoutPlanList;
