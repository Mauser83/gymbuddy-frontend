import React, {useMemo, useState, useEffect} from 'react';
import {View} from 'react-native';
import {useParams, useNavigate} from 'react-router-native';
import {useQuery} from '@apollo/client';
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
} from '../graphql/userWorkouts.graphql';
import {WorkoutSessionData, ExerciseLog} from '../types/userWorkouts.types';
import SelectableField from 'shared/components/SelectableField'; // if not already imported
import {useTheme} from 'shared/theme/ThemeProvider';

export default function ActiveWorkoutSessionScreen() {
  const {sessionId} = useParams<{sessionId: string}>();
  const navigate = useNavigate();
  const {theme} = useTheme();

  const [exercisePickerVisible, setExercisePickerVisible] = useState(false);
  const [equipmentPickerVisible, setEquipmentPickerVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [expandedSetId, setExpandedSetId] = useState<number | null>(null);
  const [defaultSelectedEquipmentIds, setDefaultSelectedEquipmentIds] =
    useState<number[]>([]);

  const {data} = useQuery<WorkoutSessionData>(GET_WORKOUT_SESSION, {
    variables: {id: Number(sessionId)},
    skip: !sessionId,
  });

  const session = data?.workoutSessionById;

  const {data: exercisesData} = useQuery(GET_EXERCISES_AVAILABLE_AT_GYM, {
    variables: {gymId: session?.gym?.id},
    skip: !session?.gym?.id,
  });

  const {data: equipmentData} = useQuery(GET_GYM_EQUIPMENT, {
    variables: {gymId: session?.gym?.id},
    skip: !session?.gym?.id,
  });

  if (session?.exerciseLogs?.length) {
    setLogs(session.exerciseLogs);
    const latestLog = session.exerciseLogs.at(-1); // ✅ last set
    if (latestLog) setExpandedSetId(latestLog.id);
  }

  const groupedLogs = useMemo(() => {
    const grouped = new Map<
      number,
      {
        exerciseId: number;
        logs: ExerciseLog[];
        equipmentIds: Set<number>;
        name?: string;
      }
    >();

    for (const log of logs) {
      const group = grouped.get(log.exerciseId) ?? {
        exerciseId: log.exerciseId,
        logs: [],
        equipmentIds: new Set<number>(),
      };

      log.equipmentIds?.forEach(id => group.equipmentIds.add(id));
      group.logs.push(log);
      grouped.set(log.exerciseId, group);
    }

    return Array.from(grouped.values()).map(group => {
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
  }, [logs, exercisesData]);

  const initialValues = useMemo(() => {
    const values: any = {};
    logs.forEach(log => {
      values[log.id] = {
        reps: log.reps ?? 0,
        weight: log.weight ?? 0,
        rpe: log.rpe ?? undefined,
        notes: log.notes ?? '',
        equipmentIds: log.equipmentIds ?? [],
      };
    });
    return values;
  }, [logs]);

  const validationSchema = Yup.object(
    Object.fromEntries(
      Object.entries(initialValues).map(([logId]) => [
        logId,
        Yup.object({
          reps: Yup.number().required('Required'),
          weight: Yup.number().required('Required'),
          rpe: Yup.number().min(0).max(10).nullable(),
          notes: Yup.string().nullable(),
          equipmentIds: Yup.array().of(Yup.number()).min(1, 'Required'),
        }),
      ]),
    ),
  );

  const availableEquipment = (equipmentData?.gymEquipmentByGymId ?? []).map(
    (entry: any) => ({
      id: entry.id,
      name: entry.equipment.name,
      subcategoryId: entry.equipment.subcategory.id,
    }),
  );

  const allEquipment = equipmentData?.gymEquipmentByGymId ?? [];

  const usedExerciseIds = new Set(logs.map(log => log.exerciseId));

  const availableExercises = (
    exercisesData?.exercisesAvailableAtGym ?? []
  ).filter((exercise: any) => {
    if (usedExerciseIds.has(exercise.id)) return false;

    const requiredSubcategories =
      exercise.equipmentSlots?.flatMap(
        (slot: any) =>
          slot.options?.map((opt: any) => opt.subcategory.id) ?? [],
      ) ?? [];
    return requiredSubcategories.some((subId: number) =>
      availableEquipment.some((eq: any) => eq.subcategoryId === subId),
    );
  });

  const handleAddExercise = () => setExercisePickerVisible(true);

  return (
    <ScreenLayout scroll>
      <View style={{gap: 16}}>
        {session && (
          <Card
            title={`Active Workout in ${session.gym?.name ?? 'Unknown Gym'}`}
            text={
              session.workoutPlan?.name
                ? `${session.workoutPlan.name}`
                : undefined
            }
          />
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={values => console.log('Submit logs:', values)}>
          {({
            values,
            handleChange,
            handleBlur,
            handleSubmit,
            errors,
            touched,
          }) => (
            <>
              {groupedLogs.map(group => (
                <Card key={group.exerciseId} style={{marginBottom: 16}}>
                  <Title text={`${group.name}`} />
                  {group.logs.map(log => {
                    const isExpanded = expandedSetId === log.id;
                    const summary = `Set ${log.setNumber}: ${log.weight ?? 0}kg x ${log.reps ?? 0}${
                      log.rpe ? ` (RPE ${log.rpe})` : ''
                    }`;

                    return (
                      <View key={log.id} style={{marginTop: 8}}>
                        <View
                          style={isExpanded && {
                            borderWidth: 2,
                            borderColor: theme.colors.accentStart,
                            borderRadius: 12,
                            margin: -8,
                            marginBottom: 8,
                          }}>
                          <View style={isExpanded && {padding: 8}}>
                            <SelectableField
                              value={
                                isExpanded
                                  ? `Set ${log.setNumber}: Editing...`
                                  : summary
                              }
                              expanded={isExpanded}
                              onPress={() =>
                                setExpandedSetId(prev =>
                                  prev === log.id ? null : log.id,
                                )
                              }
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
                                          const match = allEquipment.find(
                                            (entry: any) => entry.id === id,
                                          );
                                          return (
                                            match?.equipment?.name ?? `#${id}`
                                          );
                                        })
                                        .join('\n')}
                                    />
                                  </View>
                                  <View
                                    style={
                                      log.equipmentIds.length > 1 && {
                                        alignSelf: 'flex-end',
                                        marginBottom: 12,
                                      }
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
                                <FormInput
                                  label="Reps"
                                  value={String(values[log.id]?.reps ?? '')}
                                  onChangeText={handleChange(`${log.id}.reps`)}
                                  onBlur={() => handleBlur(`${log.id}.reps`)}
                                  keyboardType="numeric"
                                  error={
                                    (touched[log.id] as any)?.reps &&
                                    (errors[log.id] as any)?.reps
                                  }
                                />
                                <FormInput
                                  label="Weight (kg)"
                                  value={String(values[log.id]?.weight ?? '')}
                                  onChangeText={handleChange(
                                    `${log.id}.weight`,
                                  )}
                                  onBlur={() => handleBlur(`${log.id}.weight`)}
                                  keyboardType="decimal-pad"
                                  error={
                                    (touched[log.id] as any)?.weight &&
                                    (errors[log.id] as any)?.weight
                                  }
                                />
                                <FormInput
                                  label="RPE"
                                  value={String(values[log.id]?.rpe ?? '')}
                                  onChangeText={handleChange(`${log.id}.rpe`)}
                                  onBlur={() => handleBlur(`${log.id}.rpe`)}
                                  keyboardType="decimal-pad"
                                  error={
                                    (touched[log.id] as any)?.rpe &&
                                    (errors[log.id] as any)?.rpe
                                  }
                                />
                                <FormInput
                                  label="Notes"
                                  value={values[log.id]?.notes ?? ''}
                                  onChangeText={handleChange(`${log.id}.notes`)}
                                  onBlur={() => handleBlur(`${log.id}.notes`)}
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
                    onPress={() => {
                      const newLog: ExerciseLog = {
                        id: Date.now(),
                        exerciseId: group.exerciseId,
                        setNumber: group.logs.length + 1,
                        reps: 0,
                        weight: 0,
                        rpe: 7,
                        notes: '',
                        equipmentIds: [
                          ...(group.logs.at(-1)?.equipmentIds ?? []),
                        ],
                      };
                      setLogs(prev => [...prev, newLog]);
                      setExpandedSetId(newLog.id);
                    }}
                  />
                </Card>
              ))}
              {groupedLogs.length > 0 && (
                <Button text="Save Changes" onPress={() => handleSubmit()} />
              )}
            </>
          )}
        </Formik>

        <Button text="Add Exercise" onPress={handleAddExercise} />
        <DividerWithLabel label="or continue with" />
        <Button text="Finish Workout" onPress={() => navigate('/dashboard')} />
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
        equipment={availableEquipment}
        defaultSelectedEquipmentIds={defaultSelectedEquipmentIds}
        onClose={() => {
          setSelectedExercise(null);
          setEquipmentPickerVisible(false);
        }}
        onSelect={(equipmentIds: number[]) => {
          if (editingLogId != null) {
            setLogs(prev =>
              prev.map(log =>
                log.id === editingLogId ? {...log, equipmentIds} : log,
              ),
            );
            setEditingLogId(null);
          } else {
            const newLog: ExerciseLog = {
              id: Date.now(),
              exerciseId: selectedExercise.id,
              setNumber:
                logs.filter(log => log.exerciseId === selectedExercise.id)
                  .length + 1,
              reps: 0,
              weight: 0,
              rpe: 7,
              notes: '',
              equipmentIds,
            };
            setLogs(prev => [...prev, newLog]);
            setExpandedSetId(newLog.id); // ✅ Make sure this is here!
          }
          setSelectedExercise(null);
          setEquipmentPickerVisible(false);
        }}
      />
    </ScreenLayout>
  );
}
