import React from 'react';
import {View} from 'react-native';
import {useQuery, gql, useMutation} from '@apollo/client';
import {useParams, useNavigate} from 'react-router-native';
import {format} from 'date-fns';

import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import LoadingSpinner from 'shared/components/LoadingSpinner';
import ErrorMessage from 'shared/components/ErrorMessage';
import Button from 'shared/components/Button';
import Card from 'shared/components/Card';
import ClickableList from 'shared/components/ClickableList';
import DetailField from 'shared/components/DetailField';
import {
  DELETE_WORKOUT_SESSION,
  GET_WORKOUT_SESSION_DETAIL,
} from '../graphql/userWorkouts.graphql';
import {useMetricRegistry} from 'shared/context/MetricRegistry';
import {useExerciseLogSummary} from 'shared/hooks/ExerciseLogSummary';

type Muscle = {
  id: number;
  name: string;
  bodyPart: {
    id: number;
    name: string;
  };
};

type ExerciseLog = {
  id: number;
  exerciseId: number;
  setNumber: number;
  metrics: Record<number, number>; // ✅ Required now
  notes?: string | null;
  exercise: {
    id: number;
    name: string;
    primaryMuscles?: Muscle[];
  };
};

const WorkoutSessionDetailScreen = () => {
  const {sessionId} = useParams();
  const navigate = useNavigate();
  const {metricRegistry, getMetricIdsForExercise} = useMetricRegistry();

  const formatSummary = useExerciseLogSummary();

  const {data, loading, error} = useQuery(GET_WORKOUT_SESSION_DETAIL, {
    variables: {id: Number(sessionId)},
    skip: !sessionId,
  });
  const [deleteSession] = useMutation(DELETE_WORKOUT_SESSION);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load session" />;

  const session = data?.workoutSessionById;
  if (!session) return <ErrorMessage message="Session not found" />;

  const startDate = session.startedAt
    ? format(new Date(Number(session.startedAt)), 'PPP')
    : 'Unknown Date';

  type ConsecutiveGroup = {
    exerciseName: string;
    logs: ExerciseLog[];
  };

  const groupedByConsecutive: ConsecutiveGroup[] = [];

  let currentGroup: ConsecutiveGroup | null = null;

  for (const log of session.exerciseLogs) {
    const name = log.exercise.name;
    if (!currentGroup || currentGroup.exerciseName !== name) {
      if (currentGroup) groupedByConsecutive.push(currentGroup);
      currentGroup = {
        exerciseName: name,
        logs: [log],
      };
    } else {
      currentGroup.logs.push(log);
    }
  }
  if (currentGroup) groupedByConsecutive.push(currentGroup);

  return (
    <ScreenLayout>
      <Title
        text={session.workoutPlan?.name || 'Ad-hoc Session'}
        subtitle={startDate}
        align="center"
      />

      <Card title="Session Info">
        <DetailField label="Gym" value={session.gym?.name || 'Not specified'} />
        <DetailField label="Notes" value={session.notes || 'None'} />
      </Card>

      <View style={{marginVertical: 16}}>
        {groupedByConsecutive.map(({exerciseName, logs}) => (
          <View
            key={`group-${logs.map(log => log.id).join('-')}`}
            style={{marginBottom: 16}}>
            <Title text={exerciseName} align="left" />
            <ClickableList
              items={logs.map((log: ExerciseLog) => ({
                id: log.id,
                label: formatSummary(log),
                subLabel: log.notes || '',
                onPress: () => {},
                rightElement: false,
              }))}
            />
          </View>
        ))}
      </View>

      <Button
        text="Save as New Plan"
        onPress={() => {
          const groupedExercises: {
            exerciseId: number;
            logs: ExerciseLog[];
          }[] = [];

          let currentGroup: {exerciseId: number; logs: ExerciseLog[]} | null =
            null;

          for (const log of session.exerciseLogs) {
            if (!currentGroup || currentGroup.exerciseId !== log.exerciseId) {
              // Start new group
              if (currentGroup) groupedExercises.push(currentGroup);
              currentGroup = {
                exerciseId: log.exerciseId,
                logs: [log],
              };
            } else {
              currentGroup.logs.push(log);
            }
          }
          if (currentGroup) groupedExercises.push(currentGroup);

          const exercises = groupedExercises.map(group => {
            const exerciseId = group.exerciseId;
            const logs = group.logs;

            const metricIds = getMetricIdsForExercise(exerciseId);

            const metricsMap = metricIds.reduce((acc: any, metricId) => {
              const values = logs
                .map(log => log.metrics?.[metricId])
                .filter(val => val !== undefined && val !== null);

              if (values.length > 0) {
                const avg = Math.round(
                  values.reduce((sum, v) => sum + Number(v), 0) / values.length,
                );
                acc[metricId] = avg;
              }

              return acc;
            }, {});

            return {
              exerciseId,
              exerciseName: logs[0].exercise?.name || 'Unnamed Exercise',
              targetSets: logs.length,
              targetMetrics: Object.entries(metricsMap).map(
                ([metricId, min]) => ({
                  metricId: Number(metricId),
                  min,
                }),
              ),
              isWarmup: false,
              trainingMethodId: null,
            };
          });

          const bodyPartIdSet = new Set<number>();

          session.exerciseLogs.forEach((log: ExerciseLog) => {
            log.exercise?.primaryMuscles?.forEach(muscle => {
              const bodyPartId = muscle.bodyPart?.id;
              if (bodyPartId) bodyPartIdSet.add(bodyPartId);
            });
          });

          const bodyPartIds = Array.from(bodyPartIdSet);

          navigate('/workoutplan/builder', {
            state: {
              initialPlan: {
                name: `Session Copy - ${startDate}`,
                exercises,
                bodyPartIds,
                isFromSession: true,
              },
            },
          });
        }}
      />
      <View style={{paddingTop: 8}}>
        <Button
          text="Delete Workout"
          onPress={async () => {
            try {
              await deleteSession({variables: {id: Number(sessionId)}});
              navigate('/workout-session'); // Adjust to your actual sessions list route
            } catch (err) {
              console.error('Failed to delete session:', err);
            }
          }}
        />
      </View>
    </ScreenLayout>
  );
};

export default WorkoutSessionDetailScreen;
