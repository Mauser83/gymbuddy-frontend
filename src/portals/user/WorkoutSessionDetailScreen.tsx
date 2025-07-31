import React from 'react';
import {View, ScrollView} from 'react-native';
import {useQuery, useMutation} from '@apollo/client';
import {useParams, useNavigate} from 'react-router-native';
import {format} from 'date-fns';

import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import LoadingSpinner from 'shared/components/LoadingSpinner';
import ErrorMessage from 'shared/components/ErrorMessage';
import Button from 'shared/components/Button';
import Card from 'shared/components/Card';
import ExerciseGroupCard from 'shared/components/ExerciseGroupCard';
import DetailField from 'shared/components/DetailField';
import {
  DELETE_WORKOUT_SESSION,
  GET_WORKOUT_SESSION_DETAIL,
} from '../../features/workout-sessions/graphql/userWorkouts.graphql';
import {useMetricRegistry} from 'shared/context/MetricRegistry';
import {useExerciseLogSummary} from 'shared/hooks/ExerciseLogSummary';
import {spacing} from 'shared/theme/tokens';

// ... (Your type definitions remain the same)
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
  metrics: Record<number, number>;
  notes?: string | null;
  exercise: {
    id: number;
    name: string;
    primaryMuscles?: Muscle[];
  };
  equipmentIds?: number[];
};

const WorkoutSessionDetailScreen = () => {
  const {sessionId} = useParams();
  const navigate = useNavigate();
  const {getMetricIdsForExercise} = useMetricRegistry();

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

type GroupedExercise = {
    exerciseName: string;
    logs: ExerciseLog[];
  };

  type DisplayGroup = {
    key: string;
    exercises: GroupedExercise[];
  };

  const sortedLogs = [...session.exerciseLogs].sort((a, b) => {
    const ao = a.carouselOrder ?? 0;
    const bo = b.carouselOrder ?? 0;
    if (ao !== bo) return ao - bo;
    return a.setNumber - b.setNumber;
  });

  const groupMap = new Map<string, Map<number, GroupedExercise>>();

  sortedLogs.forEach(log => {
    const gKey = log.groupKey || log.instanceKey || `${log.exerciseId}`;
    if (!groupMap.has(gKey)) {
      groupMap.set(gKey, new Map());
    }
    const exMap = groupMap.get(gKey)!;
    if (!exMap.has(log.exerciseId)) {
      exMap.set(log.exerciseId, {
        exerciseName: log.exercise.name,
        logs: [],
      });
    }
    exMap.get(log.exerciseId)!.logs.push(log);
  });

  const groupedForDisplay: DisplayGroup[] = [];
  groupMap.forEach((exMap, key) => {
    groupedForDisplay.push({key, exercises: Array.from(exMap.values())});
  });

  const ListHeader = () => (
    <>
      <Title
        text={session.workoutPlan?.name || 'Ad-hoc Session'}
        subtitle={startDate}
        align="center"
      />

      <Card title="Session Info">
        <DetailField label="Gym" value={session.gym?.name || 'Not specified'} />
        <DetailField label="Notes" value={session.notes || 'None'} />
      </Card>
    </>
  );

  const ListFooter = () => (
    <View style={{paddingHorizontal: spacing.md, paddingBottom: spacing.md}}>
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
      <Button
        text="Delete Workout"
        onPress={async () => {
          try {
            await deleteSession({variables: {id: Number(sessionId)}});
            navigate('/workout-session');
          } catch (err) {
            console.error('Failed to delete session:', err);
          }
        }}
      />
    </View>
  );

const renderExerciseDetails = () => {
    let exerciseIndex = 1;
    return groupedForDisplay.map(group => {
      if (group.exercises.length > 1) {
        const groupLabel =
          session.workoutPlan?.groups.find(
            (g: any) => `group-${g.id}` === group.key,
          )?.trainingMethod?.name ?? 'Group';
        return (
          <ExerciseGroupCard label={groupLabel} key={group.key}>
            {group.exercises.map(ex => {
              const summary = ex.logs.map(l => formatSummary(l)).join('\n');
              const notes = ex.logs
                .map(l => l.notes)
                .filter(Boolean)
                .join('\n');
              const value = notes ? `${summary}\n${notes}` : summary;
              const label = `#${exerciseIndex++} ${ex.exerciseName}`;
              return (
                <View key={label} style={{marginBottom: spacing.sm}}>
                  <DetailField label={label} value={value} />
                </View>
              );
            })}
          </ExerciseGroupCard>
        );
      }

      const ex = group.exercises[0];
      const summary = ex.logs.map(l => formatSummary(l)).join('\n');
      const notes = ex.logs
        .map(l => l.notes)
        .filter(Boolean)
        .join('\n');
      const value = notes ? `${summary}\n${notes}` : summary;
      return (
        <View key={`ex-${group.key}`} style={{marginBottom: spacing.md}}>
          <DetailField
            label={`#${exerciseIndex++} ${ex.exerciseName}`}
            value={value}
          />
        </View>
      );
    });
  };

  return (
    <ScreenLayout>
      <ScrollView>
        <ListHeader />
        <View style={{marginTop: spacing.md}}>{renderExerciseDetails()}</View>
        <ListFooter />
      </ScrollView>
    </ScreenLayout>
  );
};

export default WorkoutSessionDetailScreen;
