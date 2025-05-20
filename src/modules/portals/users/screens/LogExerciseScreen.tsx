import React, {useState} from 'react';
import {View, ScrollView} from 'react-native';
import {useNavigate} from 'react-router-native';
import {Formik, FieldArray} from 'formik';
import * as Yup from 'yup';
import ScreenLayout from '../../../../shared/components/ScreenLayout';
import Title from '../../../../shared/components/Title';
import SelectableField from '../../../../shared/components/SelectableField';
import FormInput from '../../../../shared/components/FormInput';
import Button from '../../../../shared/components/Button';
import ButtonRow from '../../../../shared/components/ButtonRow';
import {spacing} from '../../../../shared/theme/tokens';
import {LogExerciseFormValues} from '../types/userWorkouts.types';
import GymPickerModal from '../components/GymPickerModal';
import WorkoutPlanPickerModal from '../components/WorkoutPlanPickerModal';
import ExercisePickerModal from '../components/ExercisePickerModal';
import EquipmentPickerModal from '../components/EquipmentPickerModal';

const ExerciseLogSchema = Yup.object().shape({
  workoutPlan: Yup.object().nullable(),
  gym: Yup.object().required('Gym is required'),
  exercises: Yup.array()
    .of(
      Yup.object().shape({
        exercise: Yup.object().required('Exercise is required'),
        equipment: Yup.object().required('Equipment is required'),
        sets: Yup.number().required('Sets required').min(1),
        reps: Yup.number().required('Reps required').min(1),
        weight: Yup.number().nullable(),
        rpe: Yup.number().required('RPE required').min(0).max(10),
        notes: Yup.string().nullable(),
      }),
    )
    .min(1, 'At least one exercise is required'),
});

export default function LogExerciseScreen() {
  const navigate = useNavigate();
  const [gymPickerVisible, setGymPickerVisible] = useState(false);
  const [planPickerVisible, setPlanPickerVisible] = useState(false);
  const [exercisePickerIndex, setExercisePickerIndex] = useState<number | null>(
    null,
  );
  const [equipmentPickerIndex, setEquipmentPickerIndex] = useState<
    number | null
  >(null);

  return (
    <ScreenLayout>
      <Formik
        initialValues={
          {
            workoutPlan: null,
            gym: null,
            exercises: [],
          } as LogExerciseFormValues
        }
        validationSchema={ExerciseLogSchema}
        onSubmit={values => {
          console.log('Submit workout session with logs', values);
        }}>
        {({values, errors, touched, handleSubmit, setFieldValue}) => (
          <ScrollView contentContainerStyle={{gap: spacing.lg}}>
            <Title text="Log Exercise" />

            <SelectableField
              label="Workout Plan (optional)"
              value={values.workoutPlan?.name || 'None'}
              onPress={() => setPlanPickerVisible(true)}
            />

            <WorkoutPlanPickerModal
              visible={planPickerVisible}
              onClose={() => setPlanPickerVisible(false)}
              onSelect={plan => setFieldValue('workoutPlan', plan)}
            />

            <SelectableField
              label="Gym"
              value={values.gym?.name || 'Select Gym'}
              onPress={() => setGymPickerVisible(true)}
            />

            <GymPickerModal
              visible={gymPickerVisible}
              onClose={() => setGymPickerVisible(false)}
              onSelect={gym => setFieldValue('gym', gym)}
            />

            <FieldArray name="exercises">
              {({push}) => (
                <View style={{gap: spacing.lg}}>
                  {values.exercises.map((exercise, index) => (
                    <View key={index} style={{gap: spacing.sm}}>
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

                      <FormInput
                        label="Sets"
                        value={exercise.sets}
                        onChangeText={text => {
                          const updated = [...values.exercises];
                          updated[index].sets = text;
                          setFieldValue('exercises', updated);
                        }}
                      />
                      <FormInput
                        label="Reps"
                        value={exercise.reps}
                        onChangeText={text => {
                          const updated = [...values.exercises];
                          updated[index].reps = text;
                          setFieldValue('exercises', updated);
                        }}
                      />
                      <FormInput
                        label="Weight (kg)"
                        value={exercise.weight}
                        onChangeText={text => {
                          const updated = [...values.exercises];
                          updated[index].weight = text;
                          setFieldValue('exercises', updated);
                        }}
                      />
                      <FormInput
                        label="RPE"
                        value={exercise.rpe}
                        onChangeText={text => {
                          const updated = [...values.exercises];
                          updated[index].rpe = text;
                          setFieldValue('exercises', updated);
                        }}
                      />
                      <FormInput
                        label="Notes"
                        value={exercise.notes}
                        onChangeText={text => {
                          const updated = [...values.exercises];
                          updated[index].notes = text;
                          setFieldValue('exercises', updated);
                        }}
                      />
                    </View>
                  ))}

                  <Button
                    text="Add Exercise"
                    onPress={() =>
                      push({
                        exercise: null,
                        equipment: null,
                        sets: '',
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

            <ButtonRow>
              <Button
                text="Cancel"
                onPress={() => navigate('/user')}
                fullWidth
              />
              <Button
                text="Finish Workout"
                onPress={() => handleSubmit()}
                disabled={values.exercises.length === 0}
                fullWidth
              />
            </ButtonRow>

            <ExercisePickerModal
              visible={exercisePickerIndex !== null}
              gymId={values.gym?.id ?? null}
              onClose={() => setExercisePickerIndex(null)}
              onSelect={exercise => {
                if (exercisePickerIndex === null) return;
                const updated = [...values.exercises];
                updated[exercisePickerIndex].exercise = exercise;
                setFieldValue('exercises', updated);
                setExercisePickerIndex(null);
              }}
            />

            <EquipmentPickerModal
              visible={equipmentPickerIndex !== null}
              gymId={values.gym?.id ?? null}
              requiredSubcategoryIds={
                equipmentPickerIndex !== null &&
                values.exercises[equipmentPickerIndex].exercise?.equipmentSlots
                  ? values.exercises[
                      equipmentPickerIndex
                    ].exercise.equipmentSlots.flatMap(
                      (slot: any) =>
                        slot.options?.map((opt: any) => opt.subcategory?.id) ??
                        [],
                    )
                  : []
              }
              onClose={() => setEquipmentPickerIndex(null)}
              onSelect={equipment => {
                if (equipmentPickerIndex === null) return;
                const updated = [...values.exercises];
                updated[equipmentPickerIndex].equipment = equipment;
                setFieldValue('exercises', updated);
                setEquipmentPickerIndex(null);
              }}
            />
          </ScrollView>
        )}
      </Formik>
    </ScreenLayout>
  );
}
