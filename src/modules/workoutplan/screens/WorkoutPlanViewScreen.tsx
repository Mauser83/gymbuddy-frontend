import React from 'react';
import {useParams, useNavigate} from 'react-router-native';
import {useQuery, useMutation} from '@apollo/client';
import {ScrollView, View, Alert} from 'react-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Card from 'shared/components/Card';
import Button from 'shared/components/Button';
import LoadingState from 'shared/components/LoadingState';
import ErrorMessage from 'shared/components/ErrorMessage';
import {GET_WORKOUT_PLAN_BY_ID} from '../graphql/workoutMeta.graphql';
import DetailField from 'shared/components/DetailField';
import ExerciseGroupCard from 'shared/components/ExerciseGroupCard';
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

  // Build group lookup for fast access
  const groupMap: Record<number, any> = {};
  (plan.groups ?? []).forEach((g: any) => {
    groupMap[g.id] = g;
  });

  // Separate grouped and ungrouped exercises
  const ungroupedExercises = (plan.exercises ?? []).filter((e: any) => e.groupId == null);
  const groupedExercisesByGroup: Record<number, any[]> = {};
  (plan.exercises ?? []).forEach((e: any) => {
    if (e.groupId != null) {
      if (!groupedExercisesByGroup[e.groupId]) groupedExercisesByGroup[e.groupId] = [];
      groupedExercisesByGroup[e.groupId].push(e);
    }
  });

  // Flatten into single display array and sort by order
  let displayItems: any[] = [...ungroupedExercises, ...(plan.groups ?? [])];
  displayItems = displayItems.sort((a: any, b: any) => a.order - b.order);


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
            groups:
              plan.groups?.map((g: any) => ({
                id: g.id,
                trainingMethodId: g.trainingMethodId,
                order: g.order,
              })) ?? [],
            exercises: plan.exercises.map((ex: any) => ({
              exerciseId: ex.exercise.id,
              exerciseName: ex.exercise.name,
              targetSets: ex.targetSets,
              targetMetrics: ex.targetMetrics.map((m: any) => ({...m})),
              trainingMethodId: ex.trainingMethod?.id ?? null,
              isWarmup: ex.isWarmup ?? false,
              groupId: ex.groupId,
              order: ex.order, // ✅ Add this line
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
      <ScrollView>
      <ListHeader />

      <View style={{marginTop: spacing.md}}>
        {(() => {
          let exerciseDisplayIndex = 1;
          return displayItems.map(item => {
            // Group item
            if (item.trainingMethodId) {
              const groupExercises =
                (groupedExercisesByGroup[item.id] ?? []).sort(
                  (a, b) => a.order - b.order,
                );
              if (groupExercises.length === 0) return null;

              const groupType =
                plan.trainingGoal?.trainingMethods?.find(
                  (m: any) => m.id === item.trainingMethodId,
                )?.name ?? 'Group';

              return (
                <ExerciseGroupCard label={groupType} key={`group-${item.id}`}>
                  {groupExercises.map(ex => (
                    <View key={ex.id} style={{marginBottom: spacing.sm}}>
                      <DetailField
                        label={`#${exerciseDisplayIndex++} ${ex.exercise.name}`}
                        value={renderSummary({
                          exerciseId: ex.exercise.id,
                          targetMetrics: ex.targetMetrics ?? [],
                          targetSets: ex.targetSets,
                        })}
                      />
                    </View>
                  ))}
                </ExerciseGroupCard>
              );
            }

            // Ungrouped exercise
            return (
              <View key={`ex-${item.id}`} style={{marginBottom: spacing.md}}>
                <DetailField
                  label={`#${exerciseDisplayIndex++} ${item.exercise.name}`}
                  value={renderSummary({
                    exerciseId: item.exercise.id,
                    targetMetrics: item.targetMetrics ?? [],
                    targetSets: item.targetSets,
                  })}
                />
              </View>
            );
          });
        })()}
      </View>

      <ListFooter />
      </ScrollView>
    </ScreenLayout>
  );
}

