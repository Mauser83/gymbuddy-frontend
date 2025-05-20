import React from 'react';
import { View, Pressable } from 'react-native';
import { useNavigate } from 'react-router-native';
import { useQuery } from '@apollo/client';
import  ScreenLayout  from '../../../../shared/components/ScreenLayout';
import  Title  from '../../../../shared/components/Title';
import  Card  from '../../../../shared/components/Card';
import  LoadingState  from '../../../../shared/components/LoadingState';
import  NoResults  from '../../../../shared/components/NoResults';
import { spacing } from '../../../../shared/theme/tokens';
import { GET_MY_WORKOUTS, GET_SHARED_WORKOUTS } from '../graphql/userWorkouts.graphql';

export default function MyWorkoutPlansScreen() {
  const navigate = useNavigate();

  const { data: myData, loading: loadingMy } = useQuery(GET_MY_WORKOUTS);
  const { data: sharedData, loading: loadingShared } = useQuery(GET_SHARED_WORKOUTS);

  const myPlans = myData?.workouts ?? [];
  const sharedPlans = sharedData?.sharedWorkouts ?? [];

  if (loadingMy || loadingShared) return <LoadingState text="Loading plans..." />;

  const renderPlans = (plans: any[], sectionTitle: string) => (
    <View style={{ marginBottom: spacing.lg }}>
      <Title text={sectionTitle} />
      {plans.length === 0 ? (
        <NoResults message="No plans found." />
      ) : (
        plans.map((plan) => (
          <Pressable
            key={plan.id}
            onPress={() => navigate(`/user/my-plans/${plan.id}`)}
            style={{ marginTop: spacing.md }}
          >
            <Card title={plan.name} text={plan.description} showChevron />
          </Pressable>
        ))
      )}
    </View>
  );

  return (
    <ScreenLayout>
      {renderPlans(myPlans, 'My Plans')}
      {renderPlans(sharedPlans, 'Shared With Me')}
    </ScreenLayout>
  );
}
