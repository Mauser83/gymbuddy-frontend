import { useQuery, useMutation } from '@apollo/client';
import { Formik } from 'formik';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useParams, useNavigate } from 'react-router-native';
import * as Yup from 'yup';

import { useAuth } from 'features/auth/context/AuthContext';
import { GET_WORKOUT_SESSIONS_BY_USER } from 'features/exercises/graphql/exercise.graphql';
import ExerciseCarousel from 'features/workout-sessions/components/ExerciseCarousel';
import ExerciseNavHeader from 'features/workout-sessions/components/ExerciseNavHeader';
import ExercisePickerModal from 'features/workout-sessions/components/ExercisePickerModal';
import MultiSlotEquipmentPickerModal from 'features/workout-sessions/components/MultiSlotEquipmentPickerModal';
import PlanTargetChecklist from 'features/workout-sessions/components/PlanTargetChecklist';
import ProgressChecklist from 'features/workout-sessions/components/ProgressChecklist';
import {
  GET_WORKOUT_SESSION,
  GET_EXERCISES_AVAILABLE_AT_GYM,
  GET_GYM_EQUIPMENT,
  CREATE_EXERCISE_LOG,
  UPDATE_EXERCISE_LOG,
  DELETE_EXERCISE_LOG,
  UPDATE_WORKOUT_SESSION,
  DELETE_WORKOUT_SESSION,
} from 'features/workout-sessions/graphql/userWorkouts.graphql';
import {
  WorkoutSessionData,
  ExerciseLog,
} from 'features/workout-sessions/types/userWorkouts.types';
import Button from 'shared/components/Button';
import ButtonRow from 'shared/components/ButtonRow';
import Card from 'shared/components/Card';
import DetailField from 'shared/components/DetailField';
import DividerWithLabel from 'shared/components/DividerWithLabel';
import FormInput from 'shared/components/FormInput';
import MetricInputGroup from 'shared/components/MetricInputGroup';
import ScreenLayout from 'shared/components/ScreenLayout';
import SelectableField from 'shared/components/SelectableField';
import SetInputRow from 'shared/components/SetInputRow';
import Title from 'shared/components/Title';
import { useMetricRegistry } from 'shared/context/MetricRegistry';
import { useExerciseLogSummary } from 'shared/hooks/ExerciseLogSummary';
import { useTheme } from 'shared/theme/ThemeProvider';
import { formatPlanMetrics } from 'shared/utils/formatPlanMetrics';
import { generateMetricSchema } from 'shared/utils/generateMetricSchema';

export default function ActiveWorkoutSessionScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { metricRegistry, getMetricIdsForExercise, createDefaultMetricsForExercise } =
    useMetricRegistry();

  const formatSummary = useExerciseLogSummary();

  const { user } = useAuth();
  const { data: historyData } = useQuery(GET_WORKOUT_SESSIONS_BY_USER, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  const weightMetricId = useMemo(
    () => Object.values(metricRegistry).find((m) => m.name === 'Weight')?.id,
    [metricRegistry],
  );
  const repsMetricId = useMemo(
    () => Object.values(metricRegistry).find((m) => m.name === 'Reps')?.id,
    [metricRegistry],
  );
  const rpeMetricId = useMemo(
    () => Object.values(metricRegistry).find((m) => m.name === 'RPE')?.id,
    [metricRegistry],
  );

  const lastLogsByExerciseId = useMemo(() => {
    const map: Record<number, any> = {};
    historyData?.workoutSessionsByUser?.forEach((s: any) => {
      s.exerciseLogs?.forEach((log: any) => {
        const exId = log.exerciseId;
        if (!map[exId] || Number(log.createdAt ?? 0) > Number(map[exId].createdAt ?? 0)) {
          map[exId] = log;
        }
      });
    });
    return map;
  }, [historyData]);

  const suggestWeight = useCallback(
    (
      exerciseId: number,
      planMetrics: {
        metricId: number;
        min: number | string;
        max?: number | string | null;
      }[],
    ): number | undefined => {
      if (weightMetricId == null) return undefined;
      const last = lastLogsByExerciseId[exerciseId];
      if (!last) return undefined;
      const lastWeight = Number(last.metrics?.[weightMetricId]);
      const lastReps = repsMetricId != null ? Number(last.metrics?.[repsMetricId]) : undefined;
      const round5 = (val: number | undefined) =>
        val == null ? undefined : Math.floor(val / 5) * 5;
      if (!lastWeight || !lastReps) return round5(lastWeight);
      const oneRm = lastWeight * (1 + lastReps / 30);
      const targetReps = Number(
        planMetrics.find((m) => m.metricId === repsMetricId)?.min ?? lastReps,
      );
      let weight = oneRm / (1 + targetReps / 30);
      const targetRpe = Number(planMetrics.find((m) => m.metricId === rpeMetricId)?.min ?? 10);
      const rir = 10 - targetRpe;
      if (!isNaN(rir)) {
        weight *= 1 - rir * 0.03;
      }
      return round5(weight);
    },
    [lastLogsByExerciseId, weightMetricId, repsMetricId, rpeMetricId],
  );

  const [exercisePickerVisible, setExercisePickerVisible] = useState(false);
  const [equipmentPickerVisible, setEquipmentPickerVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [expandedSetId, setExpandedSetId] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [defaultSelectedEquipmentIds, setDefaultSelectedEquipmentIds] = useState<number[]>([]);
  const [nextSetPlacement, setNextSetPlacement] = useState<'addSet' | 'addExercise' | null>(null);
  const [groupAlternationIndex, setGroupAlternationIndex] = useState<Record<string, number>>({});
  const [draftSet, setDraftSet] = useState<{
    exerciseId: number;
    groupKey: string;
    instanceKey: string;
    carouselOrder: number;
    setNumber: number;
    metrics: Record<string, number>;
    notes: string;
    equipmentIds: number[];
  } | null>(null);

  const { data } = useQuery<WorkoutSessionData>(GET_WORKOUT_SESSION, {
    variables: { id: Number(sessionId) },
    skip: !sessionId,
  });

  const session = data?.workoutSessionById;

  const alternatingGroups = useMemo(
    () =>
      new Set<number>(
        session?.workoutPlan?.groups
          ?.filter((g) => g.trainingMethod?.shouldAlternate)
          .map((g) => g.id) ?? [],
      ),
    [session],
  );

  const { data: exercisesData } = useQuery(GET_EXERCISES_AVAILABLE_AT_GYM, {
    variables: { gymId: session?.gym?.id },
    skip: !session?.gym?.id,
  });

  const { data: equipmentData } = useQuery(GET_GYM_EQUIPMENT, {
    variables: { gymId: session?.gym?.id },
    skip: !session?.gym?.id,
  });

  const exerciseNameMap = useMemo(() => {
    const map: Record<number, string> = {};
    exercisesData?.exercisesAvailableAtGym?.forEach((ex: any) => {
      map[ex.id] = ex.name;
    });
    return map;
  }, [exercisesData]);

  const [createExerciseLog] = useMutation(CREATE_EXERCISE_LOG);
  const [updateExerciseLog] = useMutation(UPDATE_EXERCISE_LOG);
  const [deleteExerciseLog] = useMutation(DELETE_EXERCISE_LOG);
  const [updateWorkoutSession] = useMutation(UPDATE_WORKOUT_SESSION);
  const [deleteWorkoutSession] = useMutation(DELETE_WORKOUT_SESSION);

  useEffect(() => {
    if (session?.exerciseLogs?.length) {
      setLogs(session.exerciseLogs);
    }
  }, [session]);

  const planInstances = useMemo(() => {
    const list: { key: string; planEx: any; isAlternating: boolean }[] = [];
    const counts: Record<number, number> = {};

    session?.workoutPlan?.exercises?.forEach((planEx) => {
      const idx = counts[planEx.exercise.id] ?? 0;
      counts[planEx.exercise.id] = idx + 1;
      const isAlternating =
        planEx.trainingMethod?.shouldAlternate ?? alternatingGroups.has(planEx.groupId ?? -1);
      list.push({
        key: `${planEx.exercise.id}-${idx}`,
        planEx,
        isAlternating,
      });
    });

    return list;
  }, [session, alternatingGroups]);

  const planExerciseIds = useMemo(
    () => Array.from(new Set(session?.workoutPlan?.exercises?.map((pe) => pe.exercise.id) ?? [])),
    [session],
  );

  const groupedLogs = useMemo(() => {
    const baseLogs = [...logs];
    const sorted = baseLogs.sort((a, b) => {
      const ao = a.carouselOrder ?? 0;
      const bo = b.carouselOrder ?? 0;
      if (ao !== bo) return ao - bo;
      return a.id - b.id;
    });

    const map = new Map<
      string,
      {
        key: string;
        groupKey: string;
        exerciseId: number;
        logs: ExerciseLog[];
        equipmentIds: Set<number>;
        isAlternating: boolean;
      }
    >();

    for (const log of sorted) {
      const instanceKey = log.instanceKey ?? `${log.exerciseId}`;
      if (!map.has(instanceKey)) {
        const planInfo = planInstances.find((p) => p.key === instanceKey);
        const isAlternating = planInfo?.isAlternating ?? false;
        const groupingKey =
          isAlternating && planInfo?.planEx.groupId != null
            ? `group-${planInfo.planEx.groupId}`
            : (log.groupKey ?? instanceKey);
        map.set(instanceKey, {
          key: instanceKey,
          groupKey: groupingKey,
          exerciseId: log.exerciseId,
          logs: [],
          equipmentIds: new Set<number>(),
          isAlternating,
        });
      }
      const group = map.get(instanceKey)!;
      log.equipmentIds?.forEach((id) => group.equipmentIds.add(id));
      group.logs.push(log);
    }

    if (draftSet && !map.has(draftSet.instanceKey)) {
      const planInfo = planInstances.find((p) => p.key === draftSet.instanceKey);
      const isAlternating = planInfo?.isAlternating ?? false;
      const groupingKey =
        isAlternating && planInfo?.planEx.groupId != null
          ? `group-${planInfo.planEx.groupId}`
          : draftSet.groupKey;
      map.set(draftSet.instanceKey, {
        key: draftSet.instanceKey,
        groupKey: groupingKey,
        exerciseId: draftSet.exerciseId,
        logs: [],
        equipmentIds: new Set<number>(draftSet.equipmentIds),
        isAlternating,
      });
    }

    return Array.from(map.values()).map((group) => {
      const exercise = exercisesData?.exercisesAvailableAtGym.find(
        (ex: any) => ex.id === group.exerciseId,
      );

      return {
        ...group,
        name: exercise?.name ?? `Exercise #${group.exerciseId}`,
        logs: group.logs.sort((a, b) => a.setNumber - b.setNumber),
        multipleEquipments: group.equipmentIds.size > 1,
      };
    });
  }, [logs, exercisesData, planInstances, draftSet]);

  const carouselGroups = useMemo(() => {
    const map = new Map<string, any[]>();
    const order: string[] = [];
    groupedLogs.forEach((g) => {
      if (!map.has(g.groupKey)) {
        map.set(g.groupKey, [] as any);
        order.push(g.groupKey);
      }
      map.get(g.groupKey)!.push(g);
    });
    return order.map((key) => ({ groupKey: key, exercises: map.get(key)! }));
  }, [groupedLogs]);

  useEffect(() => {
    const currentGroup = carouselGroups[carouselIndex];
    if (currentGroup?.exercises?.[0]?.isAlternating) {
      setGroupAlternationIndex((prev) => ({
        ...prev,
        [currentGroup.groupKey]: 0,
      }));
    }
  }, [carouselIndex, carouselGroups]);

  const initialValues = useMemo(() => {
    const values: Record<number, any> = {};
    logs.forEach((log) => {
      values[log.id] = {
        metrics: log.metrics ?? {}, // this holds dynamic metric values
        notes: log.notes ?? '',
        equipmentIds: log.equipmentIds ?? [],
      };
    });
    return values;
  }, [logs]);

  const allLogs = useMemo(() => (draftSet ? [...logs] : logs), [logs, draftSet]);

  const nextSet = useMemo(() => {
    const handledAltGroups = new Set<number>();

    for (let i = 0; i < planInstances.length; i++) {
      const instance = planInstances[i];

      // Handle alternating groups first
      if (
        instance.isAlternating &&
        instance.planEx.groupId != null &&
        !handledAltGroups.has(instance.planEx.groupId)
      ) {
        handledAltGroups.add(instance.planEx.groupId);

        const groupInstances = planInstances.filter(
          (p) => p.planEx.groupId === instance.planEx.groupId,
        );

        let target: typeof instance | null = null;
        let minLogged = Infinity;

        for (const gi of groupInstances) {
          const giLogged = allLogs.filter((l) => l.instanceKey === gi.key).length;
          if (giLogged < (gi.planEx.targetSets ?? 1) && giLogged < minLogged) {
            minLogged = giLogged;
            target = gi;
          }
        }

        if (target) {
          const cIndex = carouselGroups.findIndex((g) =>
            g.exercises.some((e) => e.key === target!.key),
          );

          if (cIndex !== -1) {
            setNextSetPlacement('addSet');
          } else {
            setNextSetPlacement('addExercise');
          }

          return {
            exerciseId: target.planEx.exercise.id,
            name: target.planEx.exercise.name,
            currentSetIndex: minLogged,
            targetMetrics: target.planEx.targetMetrics ?? [],
            groupKey: target.key,
            carouselIndex: cIndex,
            completed: minLogged,
            total: target.planEx.targetSets ?? 1,
          };
        }

        // All exercises in this group are complete, continue
        continue;
      }

      const logsForInstance = allLogs.filter((l) => l.instanceKey === instance.key);
      const loggedSets = logsForInstance.length;

      if (loggedSets < (instance.planEx.targetSets ?? 1)) {
        const cIndex = carouselGroups.findIndex((g) =>
          g.exercises.some((e) => e.key === instance.key),
        );

        if (cIndex !== -1) {
          setNextSetPlacement('addSet');
        } else {
          setNextSetPlacement('addExercise');
        }

        return {
          exerciseId: instance.planEx.exercise.id,
          name: instance.planEx.exercise.name,
          currentSetIndex: loggedSets,
          targetMetrics: instance.planEx.targetMetrics ?? [],
          groupKey: instance.key,
          carouselIndex: cIndex,
          completed: loggedSets,
          total: instance.planEx.targetSets ?? 1,
        };
      }
    }

    setNextSetPlacement(null);
    return null;
  }, [planInstances, allLogs, carouselGroups]);

  const availableExercises = useMemo(() => {
    if (!exercisesData || !equipmentData || !session?.gym?.id) return [];

    const allEquipment = equipmentData.gymEquipmentByGymId ?? [];
    const usedExerciseIds = new Set(logs.map((log) => log.exerciseId));

    return (exercisesData.exercisesAvailableAtGym ?? []).filter((exercise: any) => {
      const requiredSubcategories =
        exercise.equipmentSlots?.flatMap(
          (slot: any) => slot.options?.map((opt: any) => opt.subcategory.id) ?? [],
        ) ?? [];

      return requiredSubcategories.some((subId: number) =>
        allEquipment.some((eq: any) => eq.equipment.subcategory.id === subId),
      );
    });
  }, [logs, exercisesData, equipmentData, session]);

  return (
    <ScreenLayout scroll>
      <View style={{ gap: 16 }}>
        {session && (
          <Card
            title={`Active Workout in ${session.gym?.name ?? 'Unknown Gym'}`}
            text={session.workoutPlan?.name ?? undefined}
          />
        )}

        {session?.workoutPlan?.exercises?.length ? (
          <PlanTargetChecklist
            planExercises={session?.workoutPlan?.exercises.map((ex) => ({
              exerciseId: ex.exercise.id,
              name: ex.exercise.name,
              targetSets: ex.targetSets,
              targetMetrics: ex.targetMetrics ?? [],
              groupId: ex.groupId,
              trainingMethod: ex.trainingMethod
                ? {
                    id: ex.trainingMethod.id,
                    name: ex.trainingMethod.name,
                    shouldAlternate: ex.trainingMethod.shouldAlternate,
                  }
                : undefined,
              isAlternating:
                ex.trainingMethod?.shouldAlternate ?? alternatingGroups.has(ex.groupId ?? -1),
            }))}
            groups={session?.workoutPlan?.groups ?? []}
            exerciseLogs={logs}
            onSelect={(key, _exerciseId) => {
              const cIdx = carouselGroups.findIndex((g) => g.exercises.some((e) => e.key === key));
              if (cIdx !== -1) setCarouselIndex(cIdx);
            }}
          />
        ) : (
          <ProgressChecklist
            exerciseLogs={logs}
            exerciseNames={exerciseNameMap}
            onSelect={(key, _exerciseId) => {
              const cIdx = carouselGroups.findIndex((g) => g.exercises.some((e) => e.key === key));
              if (cIdx !== -1) setCarouselIndex(cIdx);
            }}
          />
        )}
        <Formik
          initialValues={initialValues}
          validationSchema={Yup.object(
            Object.entries(initialValues).reduce(
              (acc, [logId]) => {
                const log = logs.find((l) => l.id === Number(logId));
                const metricIds = log ? getMetricIdsForExercise(log.exerciseId) : [];
                acc[logId] = Yup.object().shape({
                  metrics: generateMetricSchema(metricIds, metricRegistry),
                  notes: Yup.string().nullable(),
                  equipmentIds: Yup.array().of(Yup.number()).min(1),
                });
                return acc;
              },
              {} as Record<string, Yup.ObjectSchema<any>>,
            ),
          )}
          enableReinitialize
          onSubmit={(values) => console.log('Submit logs:', values)}
        >
          {({
            values,
            handleChange,
            handleBlur,
            errors,
            touched,
            validateForm,
            setTouched,
            setFieldValue,
          }) => {
            const saveExpandedSetIfValid = async (): Promise<boolean> => {
              if (!expandedSetId) return true;
              const allErrors = await validateForm();
              const setErrors = allErrors[expandedSetId];
              if (!setErrors || Object.keys(setErrors).length === 0) {
                const log = logs.find((l) => l.id === expandedSetId);
                if (!log) return false;

                const updatedMetrics = values[expandedSetId]?.metrics ?? {};
                const updatedNotes = values[expandedSetId]?.notes ?? '';
                const updatedEquipmentIds = values[expandedSetId]?.equipmentIds ?? [];

                const arraysEqual = (a: number[], b: number[]) => {
                  if (a.length !== b.length) return false;
                  const sortedA = [...a].sort((x, y) => x - y);
                  const sortedB = [...b].sort((x, y) => x - y);
                  return sortedA.every((val, idx) => val === sortedB[idx]);
                };

                const hasChanges =
                  JSON.stringify(log.metrics ?? {}) !== JSON.stringify(updatedMetrics) ||
                  (log.notes ?? '') !== updatedNotes ||
                  !arraysEqual(log.equipmentIds ?? [], updatedEquipmentIds);

                if (!hasChanges) {
                  return true;
                }

                const input: any = {
                  setNumber: Number(log.setNumber),
                  metrics: updatedMetrics,
                  notes: updatedNotes,
                  equipmentIds: updatedEquipmentIds,
                  carouselOrder: log.carouselOrder,
                  groupKey: log.groupKey,
                  instanceKey: log.instanceKey,
                  completedAt: log.completedAt,
                  isAutoFilled: log.isAutoFilled,
                };

                const { data } = await updateExerciseLog({
                  variables: { id: log.id, input },
                });
                const saved = data.updateExerciseLog;
                setLogs((prev) => prev.map((l) => (l.id === expandedSetId ? { ...saved } : l)));
                return true;
              } else {
                setTouched({
                  ...touched,
                  [expandedSetId]: Object.keys(setErrors).reduce(
                    (acc: Record<string, boolean>, key: string) => {
                      acc[key] = true;
                      return acc;
                    },
                    {},
                  ),
                });
                return false;
              }
            };

            return (
              <>
                {nextSet && (
                  <View style={{ marginBottom: 8 }}>
                    {nextSet.carouselIndex != null &&
                    nextSet.carouselIndex >= 0 &&
                    carouselIndex !== nextSet.carouselIndex ? (
                      <TouchableOpacity onPress={() => setCarouselIndex(nextSet.carouselIndex)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ color: theme.colors.textPrimary }}>
                            Follow the plan:{' '}
                            <Text
                              style={{
                                fontWeight: 'bold',
                                color: theme.colors.accentStart,
                              }}
                            >
                              {nextSet.name}
                            </Text>{' '}
                            <Text style={{ color: theme.colors.accentStart }}>
                              ({nextSet.completed}/{nextSet.total} sets)
                            </Text>
                          </Text>
                          <FontAwesome
                            name="chevron-right"
                            size={16}
                            color={theme.colors.accentStart}
                            style={{ marginLeft: 6 }}
                          />
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View>
                        {nextSetPlacement === 'addExercise' && (
                          <Text style={{ marginBottom: 4 }}>
                            <Text style={{ color: theme.colors.textPrimary }}>Next: </Text>
                            <Text style={{ color: theme.colors.accentStart }}>{nextSet.name}</Text>
                          </Text>
                        )}
                        <Text>
                          <Text style={{ color: theme.colors.textPrimary }}>Next: </Text>
                          <Text
                            style={{
                              fontWeight: 'bold',
                              color: theme.colors.accentStart,
                            }}
                          >
                            {nextSet.name}
                          </Text>
                          <Text style={{ color: theme.colors.textPrimary }}>
                            {' '}
                            – Set {nextSet.currentSetIndex + 1}:{' '}
                          </Text>
                          <Text style={{ color: theme.colors.accentStart }}>
                            {formatPlanMetrics(nextSet.targetMetrics, metricRegistry)}
                          </Text>
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <ExerciseCarousel index={carouselIndex} onIndexChange={setCarouselIndex}>
                  {carouselGroups.map((cGroup, i) => {
                    const activeExerciseKeyForGroup =
                      cGroup.exercises[0].isAlternating && cGroup.exercises.length > 1
                        ? cGroup.exercises[groupAlternationIndex[cGroup.groupKey] ?? 0]?.key
                        : undefined;

                    return (
                      <Card key={cGroup.groupKey} style={{ marginVertical: 8 }}>
                        <ExerciseNavHeader
                          title={
                            cGroup.exercises.length > 1
                              ? (session?.workoutPlan?.groups.find(
                                  (g) => `group-${g.id}` === cGroup.groupKey,
                                )?.trainingMethod?.name ?? 'Group')
                              : cGroup.exercises[0].name
                          }
                          showPrev={i > 0}
                          showNext={i < carouselGroups.length - 1}
                          onPrev={() => setCarouselIndex(i - 1)}
                          onNext={() => setCarouselIndex(i + 1)}
                        />
                        {cGroup.exercises.length === 1 && cGroup.exercises[0].isAlternating && (
                          <Text
                            style={{
                              marginTop: 8,
                              color: theme.colors.accentStart,
                            }}
                          >
                            Add more exercises to this group to enable alternation.
                          </Text>
                        )}
                        {cGroup.exercises.map((exItem) => (
                          <View key={exItem.key} style={{ marginTop: 8 }}>
                            {cGroup.exercises.length > 1 && (
                              <Text
                                style={{
                                  fontWeight: 'bold',
                                  color: theme.colors.textPrimary,
                                  backgroundColor:
                                    exItem.key === activeExerciseKeyForGroup
                                      ? theme.colors.featureCardBackground
                                      : 'transparent',
                                  padding: 4,
                                  borderRadius: 4,
                                }}
                              >
                                {exItem.name}
                              </Text>
                            )}
                            {exItem.logs.map((log: ExerciseLog) => {
                              const isExpanded = expandedSetId === log.id;

                              return (
                                <View key={log.id} style={{ marginTop: 8 }}>
                                  <View
                                    style={
                                      isExpanded
                                        ? {
                                            borderWidth: 2,
                                            borderColor: theme.colors.accentStart,
                                            borderRadius: 12,
                                            margin: -8,
                                            marginBottom: 8,
                                          }
                                        : undefined
                                    }
                                  >
                                    <View style={isExpanded ? { padding: 8 } : undefined}>
                                      <SelectableField
                                        value={
                                          isExpanded
                                            ? `Set ${log.setNumber}: Editing...`
                                            : formatSummary(log)
                                        }
                                        expanded={isExpanded}
                                        onPress={async () => {
                                          if (expandedSetId) {
                                            const didSave = await saveExpandedSetIfValid();
                                            if (!didSave) return;
                                          }
                                          setExpandedSetId((prev) =>
                                            prev === log.id ? null : log.id,
                                          );
                                        }}
                                      />
                                      {isExpanded && (
                                        <>
                                          <View
                                            style={{
                                              flexDirection: 'row',
                                              alignItems: 'flex-end',
                                              gap: 12,
                                            }}
                                          >
                                            <View style={{ flex: 1 }}>
                                              <DetailField
                                                label="Equipment"
                                                value={(log.equipmentIds ?? [])
                                                  .map((id: number) => {
                                                    const match =
                                                      equipmentData?.gymEquipmentByGymId.find(
                                                        (entry: any) => entry.id === id,
                                                      );
                                                    return match?.equipment?.name ?? `#${id}`;
                                                  })
                                                  .join('\n')}
                                              />
                                            </View>
                                            <View
                                              style={
                                                log.equipmentIds.length > 1
                                                  ? {
                                                      alignSelf: 'flex-end',
                                                      marginBottom: 12,
                                                    }
                                                  : undefined
                                              }
                                            >
                                              <Button
                                                text="Edit"
                                                onPress={() => {
                                                  const exercise =
                                                    exercisesData?.exercisesAvailableAtGym.find(
                                                      (ex: any) => ex.id === log.exerciseId,
                                                    );
                                                  if (!exercise) return;
                                                  setSelectedExercise(exercise);
                                                  setEditingLogId(log.id);
                                                  setDefaultSelectedEquipmentIds(
                                                    log.equipmentIds ?? [],
                                                  );
                                                  setEquipmentPickerVisible(true);
                                                }}
                                              />
                                            </View>
                                          </View>
                                          <SetInputRow
                                            metricIds={getMetricIdsForExercise(log.exerciseId)}
                                            values={values[log.id]?.metrics ?? {}}
                                            onChange={(metricId, val) =>
                                              setFieldValue(`${log.id}.metrics.${metricId}`, val)
                                            }
                                          />
                                          <FormInput
                                            label="Notes"
                                            value={values[log.id]?.notes ?? ''}
                                            onChangeText={handleChange(`${log.id}.notes`)}
                                            onBlur={() => handleBlur(`${log.id}.notes`)}
                                          />
                                          <Button
                                            text="Delete Set"
                                            onPress={async () => {
                                              await deleteExerciseLog({
                                                variables: { id: log.id },
                                              });
                                              setLogs((prev) =>
                                                prev.filter((l) => l.id !== log.id),
                                              );
                                              setExpandedSetId(null);
                                            }}
                                          />
                                        </>
                                      )}
                                    </View>
                                  </View>
                                </View>
                              );
                            })}
                            {draftSet && draftSet.instanceKey === exItem.key && (
                              <View key="draft" style={{ marginTop: 8 }}>
                                <View
                                  style={
                                    expandedSetId === -1
                                      ? {
                                          borderWidth: 2,
                                          borderColor: theme.colors.accentStart,
                                          borderRadius: 12,
                                          margin: -8,
                                          marginBottom: 8,
                                        }
                                      : undefined
                                  }
                                >
                                  <View style={expandedSetId === -1 ? { padding: 8 } : undefined}>
                                    <SelectableField
                                      value={
                                        expandedSetId === -1
                                          ? `Set ${draftSet.setNumber}: Editing...`
                                          : `Set ${draftSet.setNumber}: New (unsaved)`
                                      }
                                      expanded={expandedSetId === -1}
                                      onPress={async () => {
                                        if (expandedSetId && expandedSetId !== -1) {
                                          const didSave = await saveExpandedSetIfValid();
                                          if (!didSave) return;
                                        }
                                        setExpandedSetId((prev) => (prev === -1 ? null : -1));
                                      }}
                                    />
                                    {expandedSetId === -1 && (
                                      <>
                                        <SetInputRow
                                          metricIds={getMetricIdsForExercise(draftSet.exerciseId)}
                                          values={draftSet.metrics}
                                          onChange={(metricId, val) =>
                                            setDraftSet(
                                              (prev) =>
                                                prev && {
                                                  ...prev,
                                                  metrics: {
                                                    ...prev.metrics,
                                                    [metricId]: val,
                                                  },
                                                },
                                            )
                                          }
                                        />
                                        <FormInput
                                          label="Notes"
                                          value={draftSet.notes}
                                          onChangeText={(val) =>
                                            setDraftSet((prev) => prev && { ...prev, notes: val })
                                          }
                                        />
                                        <ButtonRow>
                                          <Button
                                            text="Save Set"
                                            fullWidth
                                            onPress={async () => {
                                              if (!draftSet) return;
                                              const input = {
                                                workoutSessionId: Number(sessionId),
                                                exerciseId: draftSet.exerciseId,
                                                setNumber: draftSet.setNumber,
                                                metrics: draftSet.metrics,
                                                notes: draftSet.notes,
                                                equipmentIds: draftSet.equipmentIds,
                                                carouselOrder: draftSet.carouselOrder,
                                                groupKey: draftSet.groupKey,
                                                instanceKey: draftSet.instanceKey,
                                                completedAt: null,
                                                isAutoFilled: false,
                                              } as any;
                                              const { data } = await createExerciseLog({
                                                variables: { input },
                                              });
                                              const savedLog = data.createExerciseLog;
                                              setLogs((prev) => {
                                                const logsForInstance = prev.filter(
                                                  (l) => l.instanceKey === draftSet.instanceKey,
                                                );
                                                const insertionIndex = logsForInstance.length
                                                  ? prev.findIndex(
                                                      (l) => l.id === logsForInstance.at(-1)!.id,
                                                    ) + 1
                                                  : prev.length;
                                                const newLogs = [...prev];
                                                newLogs.splice(insertionIndex, 0, savedLog);
                                                return newLogs;
                                              });
                                              setDraftSet(null);
                                              setExpandedSetId(null);
                                            }}
                                          />
                                          <Button
                                            text="Discard"
                                            fullWidth
                                            onPress={() => {
                                              setDraftSet(null);
                                              setExpandedSetId(null);
                                            }}
                                          />
                                        </ButtonRow>
                                      </>
                                    )}
                                  </View>
                                </View>
                              </View>
                            )}
                            <Button
                              text="Add Set"
                              onPress={async () => {
                                const didSave = await saveExpandedSetIfValid();
                                if (!didSave) return;

                                const target = exItem;

                                const metrics = createDefaultMetricsForExercise(target.exerciseId);
                                const planInfo = planInstances.find((p) => p.key === target.key);
                                if (planInfo?.planEx?.targetMetrics) {
                                  planInfo.planEx.targetMetrics.forEach((tm: any) => {
                                    const val =
                                      typeof tm.min === 'string' ? Number(tm.min) : (tm.min ?? 0);
                                    metrics[tm.metricId] = val;
                                  });
                                  const suggested = suggestWeight(
                                    target.exerciseId,
                                    planInfo.planEx.targetMetrics,
                                  );
                                  if (suggested != null && weightMetricId != null) {
                                    metrics[weightMetricId] = suggested;
                                  }
                                }
                                const newDraft = {
                                  exerciseId: target.exerciseId,
                                  setNumber: (target.logs.at(-1)?.setNumber ?? 0) + 1,
                                  metrics,
                                  notes: '',
                                  equipmentIds: [...(target.logs.at(-1)?.equipmentIds ?? [])],
                                  carouselOrder: target.logs[0]?.carouselOrder ?? carouselIndex + 1,
                                  groupKey: target.groupKey,
                                  instanceKey: target.key,
                                };
                                setDraftSet(newDraft);
                                setExpandedSetId(-1);
                              }}
                            />
                          </View>
                        ))}
                      </Card>
                    );
                  })}
                </ExerciseCarousel>

                <Card>
                  <Button
                    text="Add Exercise"
                    onPress={async () => {
                      const didSave = await saveExpandedSetIfValid();
                      if (didSave) setExercisePickerVisible(true);
                    }}
                  />
                </Card>

                <DividerWithLabel label="or continue with" />

                <Button
                  text={logs.length === 0 ? 'Cancel Workout' : 'Finish Workout'}
                  onPress={async () => {
                    if (logs.length === 0) {
                      try {
                        await deleteWorkoutSession({
                          variables: { id: Number(sessionId) },
                        });
                        navigate('/user');
                      } catch (err) {
                        console.error('Failed to cancel workout:', err);
                      }
                      return;
                    }

                    const didSave = await saveExpandedSetIfValid();
                    if (!didSave) return;

                    try {
                      await updateWorkoutSession({
                        variables: {
                          id: Number(sessionId),
                          input: { endedAt: new Date().toISOString() },
                        },
                      });
                      navigate('/user');
                    } catch (err) {
                      console.error('Failed to finish workout:', err);
                    }
                  }}
                />
              </>
            );
          }}
        </Formik>
      </View>

      <ExercisePickerModal
        visible={exercisePickerVisible}
        exercises={availableExercises}
        planExerciseIds={planExerciseIds}
        onClose={() => setExercisePickerVisible(false)}
        onSelect={(exercise) => {
          setSelectedExercise(exercise);
          setExercisePickerVisible(false);
          setEquipmentPickerVisible(true);
        }}
      />

      <MultiSlotEquipmentPickerModal
        visible={equipmentPickerVisible}
        requiredSlots={
          selectedExercise?.equipmentSlots?.map((slot: any) => {
            const subcategory = slot.options[0]?.subcategory;
            return {
              subcategoryIds: slot.options.map((opt: any) => opt.subcategory.id),
              subcategoryName: subcategory?.name ?? 'Equipment',
            };
          }) ?? []
        }
        equipment={(equipmentData?.gymEquipmentByGymId ?? []).map((entry: any) => ({
          id: entry.id,
          name: entry.equipment.name,
          subcategoryId: entry.equipment.subcategory.id,
        }))}
        defaultSelectedEquipmentIds={defaultSelectedEquipmentIds}
        onClose={() => {
          setSelectedExercise(null);
          setEquipmentPickerVisible(false);
        }}
        onSelect={async (equipmentIds: number[]) => {
          if (editingLogId != null) {
            setLogs((prev) =>
              prev.map((log) => (log.id === editingLogId ? { ...log, equipmentIds } : log)),
            );
            setEditingLogId(null);
          } else {
            const metrics = createDefaultMetricsForExercise(selectedExercise.id);
            const existingCount = groupedLogs.filter(
              (g) => g.exerciseId === selectedExercise.id,
            ).length;
            const planKey = `${selectedExercise.id}-${existingCount}`;
            const currentGroup = carouselGroups[carouselIndex];
            const joinAlternatingGroup =
              currentGroup &&
              currentGroup.exercises.length === 1 &&
              currentGroup.exercises[0].isAlternating;

            const carouselOrder = joinAlternatingGroup
              ? (currentGroup.exercises[0].logs[0]?.carouselOrder ?? carouselIndex + 1)
              : groupedLogs.length + 1;

            const groupKey = joinAlternatingGroup ? currentGroup.groupKey : planKey;

            const planInfo = planInstances.find((p) => p.key === planKey);
            if (planInfo?.planEx?.targetMetrics) {
              planInfo.planEx.targetMetrics.forEach((tm: any) => {
                const val = typeof tm.min === 'string' ? Number(tm.min) : (tm.min ?? 0);
                metrics[tm.metricId] = val;
              });
              const suggested = suggestWeight(selectedExercise.id, planInfo.planEx.targetMetrics);
              if (suggested != null && weightMetricId != null) {
                metrics[weightMetricId] = suggested;
              }
            }

            const newDraft = {
              exerciseId: selectedExercise.id,
              setNumber: 1,
              metrics,
              notes: '',
              equipmentIds,
              carouselOrder,
              groupKey,
              instanceKey: planKey,
            };

            const newIndex = joinAlternatingGroup ? carouselIndex : carouselGroups.length;
            setCarouselIndex(newIndex);
            setDraftSet(newDraft);
            setExpandedSetId(-1);
          }

          setSelectedExercise(null);
          setEquipmentPickerVisible(false);
        }}
      />
    </ScreenLayout>
  );
}
