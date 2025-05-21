import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useNavigate } from 'react-router-native';
import { Formik, FieldArray } from 'formik';
import * as Yup from 'yup';
import { useQuery } from '@apollo/client';
import ScreenLayout from '../../../../shared/components/ScreenLayout';
import Title from '../../../../shared/components/Title';
import SelectableField from '../../../../shared/components/SelectableField';
import FormInput from '../../../../shared/components/FormInput';
import Button from '../../../../shared/components/Button';
import ButtonRow from '../../../../shared/components/ButtonRow';
import { spacing } from '../../../../shared/theme/tokens';
import {
  LogExerciseFormValues,
  ExerciseReference,
} from '../types/userWorkouts.types';
import GymPickerModal from '../components/GymPickerModal';
import WorkoutPlanPickerModal from '../components/WorkoutPlanPickerModal';
import ExercisePickerModal from '../components/ExercisePickerModal';
import EquipmentPickerModal from '../components/EquipmentPickerModal';
import {
  GET_EXERCISES_AVAILABLE_AT_GYM,
  GET_GYM_EQUIPMENT,
} from '../graphql/userWorkouts.graphql';

const ExerciseLogSchema = Yup.object().shape({
  workoutPlan: Yup.object().nullable(),
  gym: Yup.object().required('Gym is required'),
  exercises: Yup.array()
    .of(
      Yup.object().shape({
        exercise: Yup.object().required('Exercise is required'),
        equipment: Yup.object().required('Equipment is required'),
        sets: Yup.array()
          .of(
            Yup.object().shape({
              setNumber: Yup.number().required(),
              reps: Yup.number().required().min(1),
              weight: Yup.number().nullable(),
              rpe: Yup.number().required().min(0).max(10),
              notes: Yup.string().nullable(),
            })
          )
          .min(1, 'At least one set is required'),
      })
    )
    .min(1, 'At least one exercise is required'),
});

export default function LogExerciseScreen() {
  const navigate = useNavigate();
  const [gymPickerVisible, setGymPickerVisible] = useState(false);
  const [planPickerVisible, setPlanPickerVisible] = useState(false);
  const [exercisePickerIndex, setExercisePickerIndex] = useState<number | null>(null);
  const [equipmentPickerIndex, setEquipmentPickerIndex] = useState<number | null>(null);
  const [selectedGymId, setSelectedGymId] = useState<number | null>(null);

  const { data: exerciseData } = useQuery(GET_EXERCISES_AVAILABLE_AT_GYM, {
    variables: { gymId: selectedGymId },
    skip: !selectedGymId,
  });

  const { data: equipmentData } = useQuery(GET_GYM_EQUIPMENT, {
    variables: { gymId: selectedGymId },
    skip: !selectedGymId,
  });

  return (
    <ScreenLayout>
      <Formik
        initialValues={{
          workoutPlan: null,
          gym: null,
          exercises: [],
        } as LogExerciseFormValues}
        validationSchema={ExerciseLogSchema}
        onSubmit={(values) => {
          const allLogs = values.exercises.flatMap((exercise) =>
            exercise.sets.map((set) => ({
              exerciseId: exercise.exercise?.id!,
              gymEquipmentId: exercise.equipment?.id!,
              workoutSessionId: 1, // Replace with actual session ID
              setNumber: set.setNumber,
              reps: Number(set.reps),
              weight: Number(set.weight),
              rpe: Number(set.rpe),
              notes: set.notes,
            }))
          );

          console.log('Exercise logs to create:', allLogs);
        }}
      >
        {({ values, setFieldValue, handleSubmit }) => {
          const usedEquipmentIds = values.exercises
            .map((e) => e.equipment?.id)
            .filter((id): id is number => typeof id === 'number');

          const usedSubcategoryIds = values.exercises
            .map((e) => e.equipment?.subcategoryId)
            .filter((id): id is number => typeof id === 'number');

          const availableEquipment = (equipmentData?.gymEquipmentByGymId ?? []).filter(
            (eq: any) => !usedEquipmentIds.includes(eq.id)
          );

          const availableExercises = (exerciseData?.exercisesAvailableAtGym ?? []).filter(
            (exercise: ExerciseReference) => {
              const requiredSubcategories = exercise.equipmentSlots?.flatMap(slot =>
                slot.options?.map(opt => opt.subcategory.id) ?? []
              ) ?? [];

              return requiredSubcategories.some(subId => {
                return availableEquipment.some(
                  (eq: any) => eq.equipment.subcategory.id === subId
                );
              });
            }
          );

          return (
            <ScrollView contentContainerStyle={{ gap: spacing.lg }}>
              <Title text="Log Exercise" />

              <SelectableField
                label="Workout Plan (optional)"
                value={values.workoutPlan?.name || 'None'}
                onPress={() => setPlanPickerVisible(true)}
              />

              <WorkoutPlanPickerModal
                visible={planPickerVisible}
                onClose={() => setPlanPickerVisible(false)}
                onSelect={(plan) => setFieldValue('workoutPlan', plan)}
              />

              <SelectableField
                label="Gym"
                value={values.gym?.name || 'Select Gym'}
                onPress={() => setGymPickerVisible(true)}
              />

              <GymPickerModal
                visible={gymPickerVisible}
                onClose={() => setGymPickerVisible(false)}
                onSelect={(gym) => {
                  setFieldValue('gym', gym);
                  setSelectedGymId(gym.id);
                }}
              />

              <ExercisePickerModal
                visible={exercisePickerIndex !== null}
                exercises={availableExercises}
                onClose={() => setExercisePickerIndex(null)}
                onSelect={(exercise) => {
                  if (exercisePickerIndex === null) return;
                  const updated = [...values.exercises];
                  updated[exercisePickerIndex].exercise = exercise;
                  setFieldValue('exercises', updated);
                  setExercisePickerIndex(null);
                }}
              />

              <EquipmentPickerModal
                visible={equipmentPickerIndex !== null}
                equipment={availableEquipment.map((entry: any) => ({
                  id: entry.id,
                  name: entry.equipment.name,
                  subcategoryId: entry.equipment.subcategory.id,
                }))}
                onClose={() => setEquipmentPickerIndex(null)}
                onSelect={(equipment) => {
                  if (equipmentPickerIndex === null) return;
                  const updated = [...values.exercises];
                  updated[equipmentPickerIndex].equipment = equipment;
                  setFieldValue('exercises', updated);
                  setEquipmentPickerIndex(null);
                }}
              />

              <FieldArray name="exercises">
                {({ push }) => (
                  <View style={{ gap: spacing.lg }}>
                    {values.exercises.map((exercise, index) => (
                      <View key={index} style={{ gap: spacing.sm }}>
                        <SelectableField
                          label={`Exercise ${index + 1}`}
                          value={exercise.exercise?.name || 'Select Exercise'}
                          onPress={() => setExercisePickerIndex(index)}
                        />

                        <SelectableField
                          label="Gym Equipment"
                          value={exercise.equipment?.name || 'Select Equipment'}
                          onPress={() => setEquipmentPickerIndex(index)}
                        />

                        <FieldArray name={`exercises[${index}].sets`}>
                          {({ push: pushSet }) => (
                            <View>
                              {exercise.sets.map((set, setIndex) => (
                                <View key={setIndex}>
                                  <FormInput
                                    label={`Set ${setIndex + 1} - Reps`}
                                    value={set.reps}
                                    onChangeText={(text) => {
                                      const updated = [...values.exercises];
                                      updated[index].sets[setIndex].reps = text;
                                      setFieldValue('exercises', updated);
                                    }}
                                  />
                                  <FormInput
                                    label="Weight (kg)"
                                    value={set.weight}
                                    onChangeText={(text) => {
                                      const updated = [...values.exercises];
                                      updated[index].sets[setIndex].weight = text;
                                      setFieldValue('exercises', updated);
                                    }}
                                  />
                                  <FormInput
                                    label="RPE"
                                    value={set.rpe}
                                    onChangeText={(text) => {
                                      const updated = [...values.exercises];
                                      updated[index].sets[setIndex].rpe = text;
                                      setFieldValue('exercises', updated);
                                    }}
                                  />
                                  <FormInput
                                    label="Notes"
                                    value={set.notes}
                                    onChangeText={(text) => {
                                      const updated = [...values.exercises];
                                      updated[index].sets[setIndex].notes = text;
                                      setFieldValue('exercises', updated);
                                    }}
                                  />
                                </View>
                              ))}
                              <Button
                                text="Add Set"
                                onPress={() =>
                                  pushSet({
                                    setNumber: exercise.sets.length + 1,
                                    reps: '',
                                    weight: '',
                                    rpe: '',
                                    notes: '',
                                  })
                                }
                              />
                            </View>
                          )}
                        </FieldArray>
                      </View>
                    ))}

                    <Button
                      text="Add Exercise"
                      onPress={() => {
                        push({
                          exercise: null,
                          equipment: null,
                          sets: [
                            {
                              setNumber: 1,
                              reps: '',
                              weight: '',
                              rpe: '',
                              notes: '',
                            },
                          ],
                        });
                      }}
                    />
                  </View>
                )}
              </FieldArray>

              <ButtonRow>
                <Button text="Cancel" onPress={() => navigate('/user')} fullWidth />
                <Button
                  text="Finish Workout"
                  onPress={() => handleSubmit()}
                  disabled={values.exercises.length === 0}
                  fullWidth
                />
              </ButtonRow>
            </ScrollView>
          );
        }}
      </Formik>
    </ScreenLayout>
  );
}
