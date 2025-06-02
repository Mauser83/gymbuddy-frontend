import React from 'react';
import {useParams, useNavigate} from 'react-router-native';
import {useQuery} from '@apollo/client';
import {View, Text} from 'react-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Card from 'shared/components/Card';
import Button from 'shared/components/Button';
import LoadingState from 'shared/components/LoadingState';
import ErrorMessage from 'shared/components/ErrorMessage';
import {GET_WORKOUT_PLAN_BY_ID} from '../graphql/workoutMeta.graphql';
import DetailField from 'shared/components/DetailField';

export default function WorkoutPlanViewScreen() {
  const {id} = useParams();
  const navigate = useNavigate();

  const {data, loading, error} = useQuery(GET_WORKOUT_PLAN_BY_ID, {
    variables: {id: Number(id)},
    fetchPolicy: 'network-only',
  });

  if (loading) return <LoadingState text="Loading workout plan..." />;
  if (error || !data?.workoutPlanById) {
    return <ErrorMessage message="Could not load workout plan." />;
  }

  const plan = data.workoutPlanById;

  return (
    <ScreenLayout scroll>
      <Card title={plan.name} text="Your Workout Plan" />

      <Card>
        <Title text="Details" subtitle={plan.workoutType.categories?.name} />
        <DetailField label="Type" value={plan.workoutType.name} />
        <DetailField
          label="Muscle Groups:"
          value={plan.muscleGroups.map((g: any) => g.name).join(', ')}
        />
      </Card>

      <Card>
        <Title text="Exercises"/>

        {plan.exercises.map((ex: any, idx: number) => (
          <View key={idx} style={{marginBottom: 12}}>
            <DetailField label={`#${idx + 1} ${ex.exercise.name}`} value={`${ex.targetReps} reps @ RPE ${ex.targetRpe}`} />
          </View>
        ))}
      </Card>

      <Button
        text="Edit Plan"
        onPress={() =>
          navigate('/user/edit-plan', {state: {initialPlan: plan}})
        }
      />
    </ScreenLayout>
  );
}
