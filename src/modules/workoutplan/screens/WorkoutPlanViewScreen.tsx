import React from 'react';
import {useParams, useNavigate} from 'react-router-native';
import {useQuery, useMutation} from '@apollo/client';
import {View, FlatList, Alert} from 'react-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Card from 'shared/components/Card';
import Button from 'shared/components/Button';
import LoadingState from 'shared/components/LoadingState';
import ErrorMessage from 'shared/components/ErrorMessage';
import {GET_WORKOUT_PLAN_BY_ID} from '../graphql/workoutMeta.graphql';
import DetailField from 'shared/components/DetailField';
import {DELETE_WORKOUT_PLAN} from '../graphql/workoutReferences';
import ButtonRow from 'shared/components/ButtonRow';
import {useWorkoutPlanSummary} from 'shared/hooks/WorkoutPlanSummary';
import {spacing} from 'shared/theme/tokens';

export default function WorkoutPlanViewScreen() {
  const {id} = useParams();
  const navigate = useNavigate();

  const {data, loading, error} = useQuery(GET_WORKOUT_PLAN_BY_ID, {
    variables: {id: Number(id)},
    fetchPolicy: 'network-only',
  });
  const [deleteWorkoutPlan] = useMutation(DELETE_WORKOUT_PLAN, {
    refetchQueries: ['GetMyWorkoutPlans'],
  });

  const renderSummary = useWorkoutPlanSummary();
  const plan = data?.workoutPlanById;

  const handleDelete = async () => {
    try {
      await deleteWorkoutPlan({variables: {id: Number(id)}});
      Alert.alert('Success', 'Workout plan deleted.');
      navigate('/user/my-plans');
    } catch (err) {
      console.error('Failed to delete workout plan', err);
      Alert.alert('Error', 'Failed to delete plan.');
    }
  };

  if (loading) return <LoadingState text="Loading workout plan..." />;
  if (error || !plan) return <ErrorMessage message="Workout plan not found." />;

  const renderExerciseItem = ({
    item: ex,
    index,
  }: {
    item: any;
    index: number;
  }) => (
    <View style={{marginBottom: spacing.md}}>
      <DetailField
        label={`#${index + 1} ${ex.exercise.name}`}
        value={renderSummary({
          exerciseId: ex.exercise.id,
          targetMetrics: ex.targetMetrics ?? [],
          targetSets: ex.targetSets,
        })}
      />
    </View>
  );

  const ListHeader = () => (
    <>
      <Card>
        <Title
          text={plan.name}
          subtitle={plan.description || 'No description'}
        />
        <DetailField
          label="Training Goal"
          value={plan.trainingGoal?.name || 'Not set'}
        />
        <DetailField
          label="Difficulty"
          value={plan.intensityPreset?.experienceLevel || 'Not set'}
        />
      </Card>
      <View style={{marginTop: spacing.lg, marginBottom: spacing.sm}}>
        <Title text="Exercises" />
      </View>
    </>
  );

  const ListFooter = () => (
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
              targetMetrics: ex.targetMetrics.map((m: any) => ({...m})),
              trainingMethodId: ex.trainingMethod?.id ?? null,
              isWarmup: ex.isWarmup ?? false,
              groupId: ex.groupId
            })),
          };
          navigate('/user/edit-plan', {state: {initialPlan: formattedPlan}});
        }}
        fullWidth
      />
      <Button text="Delete Plan" onPress={handleDelete} fullWidth />
    </ButtonRow>
  );

  return (
    <ScreenLayout>
      <FlatList
        data={plan.exercises}
        renderItem={renderExerciseItem}
        keyExtractor={(item, index) => item.exercise.id.toString() + index}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
      />
    </ScreenLayout>
  );
}
