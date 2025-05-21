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
import EquipmentPickerModal from '../components/EquipmentPickerModal';
import {
  GET_WORKOUT_SESSION,
  GET_EXERCISES_AVAILABLE_AT_GYM,
  GET_GYM_EQUIPMENT,
} from '../graphql/userWorkouts.graphql';
import {WorkoutSessionData, ExerciseLog} from '../types/userWorkouts.types';

export default function ActiveWorkoutSessionScreen() {
  const {sessionId} = useParams<{sessionId: string}>();
  const navigate = useNavigate();

  const [exercisePickerVisible, setExercisePickerVisible] = useState(false);
  const [equipmentPickerVisible, setEquipmentPickerVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);

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

  useEffect(() => {
    if (session?.exerciseLogs) {
      setLogs(session.exerciseLogs);
    }
  }, [session]);

  const groupedLogs = useMemo(() => {
    const grouped = new Map<
      number,
      {exerciseId: number; logs: ExerciseLog[]; equipmentIds: Set<number>}
    >();
    for (const log of logs) {
      const group = grouped.get(log.exerciseId) ?? {
        exerciseId: log.exerciseId,
        logs: [],
        equipmentIds: new Set<number>(),
      };
      group.logs.push(log);
      if (log.gymEquipmentId) group.equipmentIds.add(log.gymEquipmentId);
      grouped.set(log.exerciseId, group);
    }
    return Array.from(grouped.values()).map(group => ({
      ...group,
      logs: group.logs.sort((a, b) => a.setNumber - b.setNumber),
      multipleEquipments: group.equipmentIds.size > 1,
    }));
  }, [logs]);

  const initialValues = useMemo(() => {
    const values: any = {};
    logs.forEach(log => {
      values[log.id] = {
        reps: log.reps ?? 0,
        weight: log.weight ?? 0,
        rpe: log.rpe ?? undefined,
        notes: log.notes ?? '',
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
        }),
      ]),
    ),
  );

  const usedEquipmentIds = useMemo(
    () => new Set(logs.map(log => log.gymEquipmentId)),
    [logs],
  );

  const availableEquipment = (equipmentData?.gymEquipmentByGymId ?? [])
    .filter((eq: any) => !usedEquipmentIds.has(eq.id))
    .map((entry: any) => ({
      id: entry.id,
      name: entry.equipment.name,
      subcategoryId: entry.equipment.subcategory.id,
    }));

  const availableExercises = (
    exercisesData?.exercisesAvailableAtGym ?? []
  ).filter((exercise: any) => {
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
        <Title text="Active Workout" subtitle={`Session ID: ${session?.id}`} />

        {session && (
          <Card
            title={`Gym: ${session.gym?.name ?? 'Unknown Gym'}`}
            text={
              session.workoutPlan?.name
                ? `Plan: ${session.workoutPlan.name}`
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
                  <Title text={`Exercise #${group.exerciseId}`} />
                  {group.multipleEquipments && (
                    <DetailField label="Note" value="Multiple equipment used" />
                  )}
                  {group.logs.map(log => (
                    <View key={log.id} style={{marginTop: 8}}>
                      <FormInput
                        label={`Set ${log.setNumber} – Reps`}
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
                        onChangeText={handleChange(`${log.id}.weight`)}
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
                    </View>
                  ))}
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

      <EquipmentPickerModal
        visible={equipmentPickerVisible}
        equipment={availableEquipment.filter((eq: any) => {
          const requiredSubcategories =
            selectedExercise?.equipmentSlots?.flatMap((slot: any) =>
              slot.options?.map((opt: any) => opt.subcategory.id),
            ) ?? [];
          return requiredSubcategories.includes(eq.subcategoryId);
        })}
        onClose={() => {
          setSelectedExercise(null);
          setEquipmentPickerVisible(false);
        }}
        onSelect={equipment => {
          const newLog: ExerciseLog = {
            id: Date.now(), // use a numeric timestamp
            exerciseId: selectedExercise.id,
            gymEquipmentId: equipment.id,
            setNumber:
              logs.filter(log => log.exerciseId === selectedExercise.id)
                .length + 1,
            reps: 0,
            weight: 0,
            rpe: 7,
            notes: undefined,
          };
          setLogs(prev => [...prev, newLog]);
          setSelectedExercise(null);
          setEquipmentPickerVisible(false);
        }}
      />
    </ScreenLayout>
  );
}
