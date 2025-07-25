import React, {useMemo, useState, useEffect} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {useParams, useNavigate} from 'react-router-native';
import {useQuery, useMutation} from '@apollo/client';
import {Formik} from 'formik';
import * as Yup from 'yup';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Card from 'shared/components/Card';
import Button from 'shared/components/Button';
import DetailField from 'shared/components/DetailField';
import DividerWithLabel from 'shared/components/DividerWithLabel';
import FormInput from 'shared/components/FormInput';
import ExercisePickerModal from '../components/ExercisePickerModal';
import MultiSlotEquipmentPickerModal from '../components/MultiSlotEquipmentPickerModal';
import {
  GET_WORKOUT_SESSION,
  GET_EXERCISES_AVAILABLE_AT_GYM,
  GET_GYM_EQUIPMENT,
  CREATE_EXERCISE_LOG,
  UPDATE_EXERCISE_LOG,
  DELETE_EXERCISE_LOG,
  UPDATE_WORKOUT_SESSION,
  DELETE_WORKOUT_SESSION,
} from '../graphql/userWorkouts.graphql';
import {WorkoutSessionData, ExerciseLog} from '../types/userWorkouts.types';
import SelectableField from 'shared/components/SelectableField';
import {useTheme} from 'shared/theme/ThemeProvider';
import PlanTargetChecklist from '../components/PlanTargetChecklist';
import ExerciseCarousel from '../components/ExerciseCarousel';
import MetricInputGroup from 'shared/components/MetricInputGroup';
import SetInputRow from 'shared/components/SetInputRow';
import ExerciseNavHeader from '../components/ExerciseNavHeader';
import {useMetricRegistry} from 'shared/context/MetricRegistry';
import {generateMetricSchema} from 'shared/utils/generateMetricSchema';
import {useExerciseLogSummary} from 'modules/exerciselog/components/ExerciseLogSummary';
import {formatPlanMetrics} from 'shared/utils/formatPlanMetrics';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

export default function ActiveWorkoutSessionScreen() {
  const {sessionId} = useParams<{sessionId: string}>();
  const navigate = useNavigate();
  const {theme} = useTheme();
  const {
    metricRegistry,
    getMetricIdsForExercise,
    createDefaultMetricsForExercise,
  } = useMetricRegistry();

  const formatSummary = useExerciseLogSummary();

  const [exercisePickerVisible, setExercisePickerVisible] = useState(false);
  const [equipmentPickerVisible, setEquipmentPickerVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [expandedSetId, setExpandedSetId] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [defaultSelectedEquipmentIds, setDefaultSelectedEquipmentIds] =
    useState<number[]>([]);
  const [nextSetPlacement, setNextSetPlacement] = useState<
    'addSet' | 'addExercise' | null
  >(null);
  const [groupAlternationIndex, setGroupAlternationIndex] = useState<Record<string, number>>({});

  const {data} = useQuery<WorkoutSessionData>(GET_WORKOUT_SESSION, {
    variables: {id: Number(sessionId)},
    skip: !sessionId,
  });

  const session = data?.workoutSessionById;

  const alternatingGroups = useMemo(
    () =>
      new Set<number>(
        session?.workoutPlan?.groups
          ?.filter(g => g.trainingMethod?.shouldAlternate)
          .map(g => g.id) ?? [],
      ),
    [session],
  );

  const {data: exercisesData} = useQuery(GET_EXERCISES_AVAILABLE_AT_GYM, {
    variables: {gymId: session?.gym?.id},
    skip: !session?.gym?.id,
  });

  const {data: equipmentData} = useQuery(GET_GYM_EQUIPMENT, {
    variables: {gymId: session?.gym?.id},
    skip: !session?.gym?.id,
  });

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
    const list: {key: string; planEx: any; isAlternating: boolean}[] = [];
    const counts: Record<number, number> = {};

    session?.workoutPlan?.exercises?.forEach(planEx => {
      const idx = counts[planEx.exercise.id] ?? 0;
      counts[planEx.exercise.id] = idx + 1;
      const isAlternating =
        planEx.trainingMethod?.shouldAlternate ??
        alternatingGroups.has(planEx.groupId ?? -1);
      list.push({
        key: `${planEx.exercise.id}-${idx}`,
        planEx,
        isAlternating,
      });
    });

    return list;
  }, [session, alternatingGroups]);

  const groupedLogs = useMemo(() => {
    const sorted = [...logs].sort((a, b) => {
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
        const planInfo = planInstances.find(p => p.key === instanceKey);
        const isAlternating = planInfo?.isAlternating ?? false;
        const groupingKey =
          isAlternating && planInfo?.planEx.groupId != null
            ? `group-${planInfo.planEx.groupId}`
            : log.groupKey ?? instanceKey;
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
      log.equipmentIds?.forEach(id => group.equipmentIds.add(id));
      group.logs.push(log);
    }

    return Array.from(map.values()).map(group => {
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
  }, [logs, exercisesData, planInstances]);

  const carouselGroups = useMemo(() => {
    const map = new Map<string, any[]>();
    const order: string[] = [];
    groupedLogs.forEach(g => {
      if (!map.has(g.groupKey)) {
        map.set(g.groupKey, [] as any);
        order.push(g.groupKey);
      }
      map.get(g.groupKey)!.push(g);
    });
    return order.map(key => ({groupKey: key, exercises: map.get(key)!}));
  }, [groupedLogs]);

    useEffect(() => {
    const currentGroup = carouselGroups[carouselIndex];
    if (currentGroup?.exercises?.[0]?.isAlternating) {
      setGroupAlternationIndex(prev => ({
        ...prev,
        [currentGroup.groupKey]: 0,
      }));
    }
  }, [carouselIndex, carouselGroups]);

  
  const initialValues = useMemo(() => {
    const values: Record<number, any> = {};
    logs.forEach(log => {
      values[log.id] = {
        metrics: log.metrics ?? {}, // this holds dynamic metric values
        notes: log.notes ?? '',
        equipmentIds: log.equipmentIds ?? [],
      };
    });
    return values;
  }, [logs]);

  const nextSet = useMemo(() => {
    for (let i = 0; i < groupedLogs.length; i++) {
      const group = groupedLogs[i];
      const planWithIdx = planInstances.find(p => p.key === group.key);
      if (!planWithIdx) continue;

      const planEx = planWithIdx.planEx;
      const loggedSets = group.logs.length;

      if (loggedSets < (planEx.targetSets ?? 1)) {
        setNextSetPlacement('addSet');

        return {
          exerciseId: planEx.exercise.id,
          name: planEx.exercise.name,
          currentSetIndex: loggedSets,
          targetMetrics: planEx.targetMetrics ?? [],
          groupKey: group.key,
          carouselIndex: carouselGroups.findIndex(
            cg => cg.groupKey === group.groupKey,
          ),
          completed: loggedSets,
          total: planEx.targetSets ?? 1,
        };
      }
    }

    setNextSetPlacement(null);
    return null;
  }, [planInstances, groupedLogs, carouselGroups]);

  const availableExercises = useMemo(() => {
    if (!exercisesData || !equipmentData || !session?.gym?.id) return [];

    const allEquipment = equipmentData.gymEquipmentByGymId ?? [];
    const usedExerciseIds = new Set(logs.map(log => log.exerciseId));

    return (exercisesData.exercisesAvailableAtGym ?? []).filter(
      (exercise: any) => {
        const requiredSubcategories =
          exercise.equipmentSlots?.flatMap(
            (slot: any) =>
              slot.options?.map((opt: any) => opt.subcategory.id) ?? [],
          ) ?? [];

        return requiredSubcategories.some((subId: number) =>
          allEquipment.some((eq: any) => eq.equipment.subcategory.id === subId),
        );
      },
    );
  }, [logs, exercisesData, equipmentData, session]);

  return (
    <ScreenLayout scroll>
      <View style={{gap: 16}}>
        {session && (
          <Card
            title={`Active Workout in ${session.gym?.name ?? 'Unknown Gym'}`}
            text={session.workoutPlan?.name ?? undefined}
          />
        )}

        {session?.workoutPlan?.exercises && (
          <PlanTargetChecklist
            planExercises={session?.workoutPlan?.exercises.map(ex => ({
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
                ex.trainingMethod?.shouldAlternate ??
                alternatingGroups.has(ex.groupId ?? -1),
            }))}
            groups={session?.workoutPlan?.groups ?? []}
            exerciseLogs={logs}
            onSelect={(key, _exerciseId) => {
              const idx = groupedLogs.findIndex(g => g.key === key);
              if (idx !== -1) setCarouselIndex(idx);
            }}
          />
        )}
        <Formik
          initialValues={initialValues}
          validationSchema={Yup.object(
            Object.entries(initialValues).reduce(
              (acc, [logId]) => {
                const log = logs.find(l => l.id === Number(logId));
                const metricIds = log
                  ? getMetricIdsForExercise(log.exerciseId)
                  : [];
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
          onSubmit={values => console.log('Submit logs:', values)}>
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
                const log = logs.find(l => l.id === expandedSetId);
                if (!log) return false;

                const updatedMetrics = values[expandedSetId]?.metrics ?? {};
                const updatedNotes = values[expandedSetId]?.notes ?? '';
                const updatedEquipmentIds =
                  values[expandedSetId]?.equipmentIds ?? [];

                const arraysEqual = (a: number[], b: number[]) => {
                  if (a.length !== b.length) return false;
                  const sortedA = [...a].sort((x, y) => x - y);
                  const sortedB = [...b].sort((x, y) => x - y);
                  return sortedA.every((val, idx) => val === sortedB[idx]);
                };

                const hasChanges =
                  JSON.stringify(log.metrics ?? {}) !==
                    JSON.stringify(updatedMetrics) ||
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

                const {data} = await updateExerciseLog({
                  variables: {id: log.id, input},
                });
                const saved = data.updateExerciseLog;
                setLogs(prev =>
                  prev.map(l => (l.id === expandedSetId ? {...saved} : l)),
                );
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
                  <View style={{marginBottom: 8}}>
                    {carouselIndex !== nextSet.carouselIndex ? (
                      <TouchableOpacity
                        onPress={() => setCarouselIndex(nextSet.carouselIndex)}>
                        <View
                          style={{flexDirection: 'row', alignItems: 'center'}}>
                          <Text style={{color: theme.colors.textPrimary}}>
                            Follow the plan:{' '}
                            <Text
                              style={{
                                fontWeight: 'bold',
                                color: theme.colors.accentStart,
                              }}>
                              {nextSet.name}
                            </Text>{' '}
                            <Text style={{color: theme.colors.accentStart}}>
                              ({nextSet.completed}/{nextSet.total} sets)
                            </Text>
                          </Text>
                          <FontAwesome
                            name="chevron-right"
                            size={16}
                            color={theme.colors.accentStart}
                            style={{marginLeft: 6}}
                          />
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View>
                        {nextSetPlacement === 'addExercise' && (
                          <Text style={{marginBottom: 4}}>
                            <Text style={{color: theme.colors.textPrimary}}>
                              Next:{' '}
                            </Text>
                            <Text style={{color: theme.colors.accentStart}}>
                              {nextSet.name}
                            </Text>
                          </Text>
                        )}
                        <Text>
                          <Text style={{color: theme.colors.textPrimary}}>
                            Set {nextSet.currentSetIndex + 1}:{' '}
                          </Text>
                          <Text style={{color: theme.colors.accentStart}}>
                            {formatPlanMetrics(
                              nextSet.targetMetrics,
                              metricRegistry,
                            )}
                          </Text>
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <ExerciseCarousel
                  index={carouselIndex}
                  onIndexChange={setCarouselIndex}>
                                    {carouselGroups.map((cGroup, i) => {
                    const activeExerciseKeyForGroup =
                      cGroup.exercises[0].isAlternating && cGroup.exercises.length > 1
                        ? cGroup.exercises[
                            groupAlternationIndex[cGroup.groupKey] ?? 0
                          ]?.key
                        : undefined;

                    return (
                      <Card key={cGroup.groupKey} style={{marginVertical: 8}}>
                      <ExerciseNavHeader
                        title={
                          cGroup.exercises.length > 1
                            ? 'Group'
                            : cGroup.exercises[0].name
                        }
                        showPrev={i > 0}
                        showNext={i < carouselGroups.length - 1}
                        onPrev={() => setCarouselIndex(i - 1)}
                        onNext={() => setCarouselIndex(i + 1)}
                      />
                      {cGroup.exercises.length === 1 &&
                        cGroup.exercises[0].isAlternating && (
                          <Text style={{marginTop: 8}}>
                            Add more exercises to this group to enable
                            alternation.
                          </Text>
                        )}
                      {cGroup.exercises.map(exItem => (
                        <View key={exItem.key} style={{marginTop: 8}}>
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
                              }}>
                              {exItem.name}
                            </Text>
                          )}
                          {exItem.logs.map((log: ExerciseLog) => {
                            const isExpanded = expandedSetId === log.id;

                            return (
                              <View key={log.id} style={{marginTop: 8}}>
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
                                  }>
                                  <View
                                    style={
                                      isExpanded ? {padding: 8} : undefined
                                    }>
                                    <SelectableField
                                      value={
                                        isExpanded
                                          ? `Set ${log.setNumber}: Editing...`
                                          : formatSummary(log)
                                      }
                                      expanded={isExpanded}
                                      onPress={async () => {
                                        if (expandedSetId) {
                                          const didSave =
                                            await saveExpandedSetIfValid();
                                          if (!didSave) return;
                                        }
                                        setExpandedSetId(prev =>
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
                                          }}>
                                          <View style={{flex: 1}}>
                                            <DetailField
                                              label="Equipment"
                                              value={(log.equipmentIds ?? [])
                                                .map((id: number) => {
                                                  const match =
                                                    equipmentData?.gymEquipmentByGymId.find(
                                                      (entry: any) =>
                                                        entry.id === id,
                                                    );
                                                  return (
                                                    match?.equipment?.name ??
                                                    `#${id}`
                                                  );
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
                                            }>
                                            <Button
                                              text="Edit"
                                              onPress={() => {
                                                const exercise =
                                                  exercisesData?.exercisesAvailableAtGym.find(
                                                    (ex: any) =>
                                                      ex.id === log.exerciseId,
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
                                          metricIds={getMetricIdsForExercise(
                                            log.exerciseId,
                                          )}
                                          values={values[log.id]?.metrics ?? {}}
                                          onChange={(metricId, val) =>
                                            setFieldValue(
                                              `${log.id}.metrics.${metricId}`,
                                              val,
                                            )
                                          }
                                        />
                                        <FormInput
                                          label="Notes"
                                          value={values[log.id]?.notes ?? ''}
                                          onChangeText={handleChange(
                                            `${log.id}.notes`,
                                          )}
                                          onBlur={() =>
                                            handleBlur(`${log.id}.notes`)
                                          }
                                        />
                                        <Button
                                          text="Delete Set"
                                          onPress={async () => {
                                            await deleteExerciseLog({
                                              variables: {id: log.id},
                                            });
                                            setLogs(prev =>
                                              prev.filter(l => l.id !== log.id),
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
                          <Button
                            text="Add Set"
                            onPress={async () => {
                              const didSave = await saveExpandedSetIfValid();
                              if (!didSave) return;
                              let target;

                              if (
                                cGroup.exercises[0].isAlternating &&
                                cGroup.exercises.length > 1
                              ) {
                                const currentIndex =
                                  groupAlternationIndex[cGroup.groupKey] ?? 0;
                                target = cGroup.exercises[currentIndex];

                                const nextIndex =
                                  (currentIndex + 1) % cGroup.exercises.length;
                                setGroupAlternationIndex(prev => ({
                                  ...prev,
                                  [cGroup.groupKey]: nextIndex,
                                }));
                              } else {
                                // fallback to least filled
                                target = cGroup.exercises.reduce(
                                  (prev, curr) =>
                                    curr.logs.length < prev.logs.length
                                      ? curr
                                      : prev,
                                  cGroup.exercises[0],
                                );
                              }
                              const metrics = createDefaultMetricsForExercise(
                                target.exerciseId,
                              );
                              const baseLog = {
                                workoutSessionId: Number(sessionId),
                                exerciseId: target.exerciseId,
                                setNumber:
                                  (target.logs.at(-1)?.setNumber ?? 0) + 1,
                                metrics, // default empty metrics; user will fill it in
                                notes: '',
                                equipmentIds: [
                                  ...(target.logs.at(-1)?.equipmentIds ?? []),
                                ],
                                carouselOrder:
                                  target.logs[0]?.carouselOrder ??
                                  carouselIndex + 1,
                                groupKey: target.groupKey,
                                instanceKey: target.key,
                                completedAt: null,
                                isAutoFilled: false,
                              };

                              const {data} = await createExerciseLog({
                                variables: {input: baseLog},
                              });

                              const savedLog = data.createExerciseLog;
                              setLogs(prev => {
                                const insertionIndex = target.logs.length
                                  ? prev.findIndex(
                                      l => l.id === target.logs.at(-1)!.id,
                                    ) + 1
                                  : prev.length;
                                const newLogs = [...prev];
                                newLogs.splice(insertionIndex, 0, savedLog);
                                return newLogs;
                              });
                              setExpandedSetId(savedLog.id);
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
                          variables: {id: Number(sessionId)},
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
                          input: {endedAt: new Date().toISOString()},
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
        onClose={() => setExercisePickerVisible(false)}
        onSelect={exercise => {
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
              subcategoryIds: slot.options.map(
                (opt: any) => opt.subcategory.id,
              ),
              subcategoryName: subcategory?.name ?? 'Equipment',
            };
          }) ?? []
        }
        equipment={(equipmentData?.gymEquipmentByGymId ?? []).map(
          (entry: any) => ({
            id: entry.id,
            name: entry.equipment.name,
            subcategoryId: entry.equipment.subcategory.id,
          }),
        )}
        defaultSelectedEquipmentIds={defaultSelectedEquipmentIds}
        onClose={() => {
          setSelectedExercise(null);
          setEquipmentPickerVisible(false);
        }}
        onSelect={async (equipmentIds: number[]) => {
          if (editingLogId != null) {
            setLogs(prev =>
              prev.map(log =>
                log.id === editingLogId ? {...log, equipmentIds} : log,
              ),
            );
            setEditingLogId(null);
          } else {
            const metrics = createDefaultMetricsForExercise(
              selectedExercise.id,
            );
            const existingCount = groupedLogs.filter(
              g => g.exerciseId === selectedExercise.id,
            ).length;
            const planKey = `${selectedExercise.id}-${existingCount}`;
            const currentGroup = carouselGroups[carouselIndex];
            const joinAlternatingGroup =
              currentGroup &&
              currentGroup.exercises.length === 1 &&
              currentGroup.exercises[0].isAlternating;

            const carouselOrder = joinAlternatingGroup
              ? currentGroup.exercises[0].logs[0]?.carouselOrder ??
                carouselIndex + 1
              : groupedLogs.length + 1;

            const groupKey = joinAlternatingGroup
              ? currentGroup.groupKey
              : planKey;

            const baseLog = {
              workoutSessionId: Number(sessionId),
              exerciseId: selectedExercise.id,
              setNumber: 1,
              metrics, // default empty metrics; user will fill it in
              notes: '',
              equipmentIds,
              carouselOrder,
              groupKey,
              instanceKey: planKey,
              completedAt: null,
              isAutoFilled: false,
            };

            const {data} = await createExerciseLog({
              variables: {input: baseLog},
            });

            const savedLog = data.createExerciseLog;
            setLogs(prev => [...prev, savedLog]);
            setExpandedSetId(savedLog.id);
          }

          setSelectedExercise(null);
          setEquipmentPickerVisible(false);
        }}
      />
    </ScreenLayout>
  );
}
