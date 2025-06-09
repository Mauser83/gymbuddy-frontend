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
import {useMutation} from '@apollo/client';
import {DELETE_WORKOUT_PLAN} from '../graphql/workoutReferences';
import ButtonRow from 'shared/components/ButtonRow';
import {useWorkoutPlanSummary} from 'shared/hooks/WorkoutPlanSummary';

export default function WorkoutPlanViewScreen() {
  const {id} = useParams();
  const navigate = useNavigate();

  const {data, loading, error} = useQuery(GET_WORKOUT_PLAN_BY_ID, {
    variables: {id: Number(id)},
    fetchPolicy: 'network-only',
  });
  const [deleteWorkoutPlan] = useMutation(DELETE_WORKOUT_PLAN);

  const renderSummary = useWorkoutPlanSummary();

  const handleDelete = async () => {
    try {
      await deleteWorkoutPlan({variables: {id: Number(id)}});
      navigate('/user/my-plans');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <LoadingState text="Loading workout plan..." />;
  if (error || !data?.workoutPlanById) {
    return <ErrorMessage message="Could not load workout plan." />;
  }

  const plan = data.workoutPlanById;

  console.log(plan);

  return (
    <ScreenLayout scroll>
      <Card title={plan.name} text="Your Workout Plan" />

      <Card>
        <Title text="Details" />
        <DetailField
          label="Training Goal"
          value={plan.trainingGoal?.name || '–'}
        />
        <DetailField
          label="Experience Level"
          value={
            plan.intensityPreset?.experienceLevel
              ? plan.intensityPreset.experienceLevel.charAt(0) +
                plan.intensityPreset.experienceLevel.slice(1).toLowerCase()
              : '–'
          }
        />
        <DetailField
          label="Muscle Groups:"
          value={plan.muscleGroups.map((g: any) => g.name).join(', ')}
        />
      </Card>

      <Card>
        <Title text="Exercises" />

        {plan.exercises.map((ex: any, idx: number) => (
          <View key={idx} style={{marginBottom: 12}}>
            <DetailField
              label={`#${idx + 1} ${ex.exercise.name}`}
              value={renderSummary({
                exerciseId: ex.exercise.id,
                targetMetrics: ex.targetMetrics ?? [],
                targetSets: ex.targetSets,
              })}
            />
          </View>
        ))}
      </Card>

      <ButtonRow>
        <Button
          text="Edit Plan"
          onPress={() => {
            const formattedPlan = {
              ...plan,
              isFromSession: false,
              exercises: plan.exercises.map((ex: any) => ({
                exerciseId: ex.exercise.id,
                exerciseName: ex.exercise.name,
                targetSets: ex.targetSets,
                targetMetrics: ex.targetMetrics.map((m: any) => ({
                  metricId: m.metricId,
                  min: m.min,
                  max: m.max,
                })),
                trainingMethodId: ex.trainingMethod?.id ?? null,
                isWarmup: ex.isWarmup ?? false,
              })),
            };

            navigate('/user/edit-plan', {state: {initialPlan: formattedPlan}});
          }}
          fullWidth
        />
        <Button text="Delete Plan" onPress={handleDelete} fullWidth />
      </ButtonRow>
    </ScreenLayout>
  );
}
