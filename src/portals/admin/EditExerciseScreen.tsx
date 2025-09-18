import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import { useNavigate, useParams } from 'react-router-native';
import * as Yup from 'yup';

import ExerciseForm from 'src/features/exercises/components/ExerciseForm';
import { useExercise } from 'src/features/exercises/hooks/useExercise';
import { UpdateExerciseInput, Exercise } from 'src/features/exercises/types/exercise.types';
import Button from 'src/shared/components/Button';
import ButtonRow from 'src/shared/components/ButtonRow';
import DividerWithLabel from 'src/shared/components/DividerWithLabel';
import LoadingState from 'src/shared/components/LoadingState';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import Title from 'src/shared/components/Title';

const ExerciseSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  description: Yup.string(),
  videoUrl: Yup.string().url('Must be a valid video URL'),
  difficultyId: Yup.number().nullable(),
  exerciseTypeId: Yup.number().nullable(),
  primaryMuscleIds: Yup.array().of(Yup.number()).min(1, 'Select at least one primary muscle'),
  secondaryMuscleIds: Yup.array().of(Yup.number()),
  equipmentSlots: Yup.array().of(
    Yup.object({
      slotIndex: Yup.number(),
      isRequired: Yup.boolean(),
      comment: Yup.string().nullable(),
      options: Yup.array()
        .of(
          Yup.object({
            subcategoryId: Yup.number().required(),
          }),
        )
        .min(1, 'Each slot must have at least one equipment option'),
    }),
  ),
});

export default function EditExerciseScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useMyExercises: useMyExercisesQuery, updateExercise } = useExercise();
  const [formValues, setFormValues] = useState<UpdateExerciseInput | null>(null);

  const { data, loading } = useMyExercisesQuery();

  useEffect(() => {
    if (!id) {
      navigate('/exercise');
      return;
    }

    if (data) {
      const exercise = data.getExercises.find((e: Exercise) => e.id === Number(id));
      if (!exercise) return;

      setFormValues({
        name: exercise.name,
        description: exercise.description ?? '',
        videoUrl: exercise.videoUrl ?? '',
        difficultyId: exercise.difficulty?.id,
        exerciseTypeId: exercise.exerciseType?.id,
        primaryMuscleIds: exercise.primaryMuscles?.map((m) => m.id) ?? [],
        secondaryMuscleIds: exercise.secondaryMuscles?.map((m) => m.id) ?? [],
        equipmentSlots:
          exercise.equipmentSlots?.map((slot) => ({
            slotIndex: slot.slotIndex,
            isRequired: slot.isRequired,
            comment: slot.comment,
            options: slot.options.map((opt) => ({
              subcategoryId: opt.subcategory.id,
              name: opt.subcategory.name,
            })),
          })) ?? [],
      });
    }
  }, [id, data, navigate]);

  if (loading || !formValues) {
    return (
      <ScreenLayout variant="centered">
        <LoadingState text="Loading exercise..." />
      </ScreenLayout>
    );
  }

  const exercise = data?.getExercises.find((e: Exercise) => e.id === Number(id));
  if (!exercise) {
    return (
      <ScreenLayout variant="centered">
        <Title text="Exercise not found." />
      </ScreenLayout>
    );
  }

  const handleSubmit = async (
    values: UpdateExerciseInput,
    { setSubmitting }: { setSubmitting: (val: boolean) => void },
  ) => {
    try {
      const payload = {
        ...values,
        videoUrl: values.videoUrl?.trim() || undefined,
        equipmentSlots: (values.equipmentSlots ?? []).map((slot, index) => ({
          ...slot,
          slotIndex: index,
        })),
      };
      await updateExercise({
        variables: { id: Number(id), input: payload },
      });
      Toast.show({ type: 'success', text1: 'Exercise updated!' });
      navigate('/exercise');
    } catch (err) {
      console.error('Error updating exercise', err);
      Toast.show({ type: 'error', text1: 'Failed to update exercise' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout scroll>
      <Title text="Edit Exercise" />
      <Formik initialValues={formValues} validationSchema={ExerciseSchema} onSubmit={handleSubmit}>
        {({ handleSubmit, isSubmitting }) => (
          <>
            <ExerciseForm />
            {/* Submit / Cancel – main form actions */}
            <DividerWithLabel label="Continue with" />

            <ButtonRow>
              <Button text="Cancel" fullWidth onPress={() => navigate('/exercise')} />
              <Button text="Update" fullWidth onPress={handleSubmit} disabled={isSubmitting} />
            </ButtonRow>
          </>
        )}
      </Formik>
    </ScreenLayout>
  );
}
