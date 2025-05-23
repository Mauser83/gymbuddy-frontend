import React, {useEffect} from 'react';
import {useNavigate, useParams} from 'react-router-native';
import {Formik} from 'formik';
import * as Yup from 'yup';

import {useExercise} from '../../exercise/hooks/useExercise';
import {
  UpdateExerciseInput,
  Exercise,
} from '../../exercise/types/exercise.types';

import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Button from 'shared/components/Button';
import LoadingState from 'shared/components/LoadingState';
import ExerciseForm from '../components/ExerciseForm';
import Toast from 'react-native-toast-message';
import ButtonRow from 'shared/components/ButtonRow';
import DividerWithLabel from 'shared/components/DividerWithLabel';

const ExerciseSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  description: Yup.string(),
  videoUrl: Yup.string().url('Must be a valid video URL'),
  difficultyId: Yup.number().nullable(),
  exerciseTypeId: Yup.number().nullable(),
  primaryMuscleIds: Yup.array()
    .of(Yup.number())
    .min(1, 'Select at least one primary muscle'),
  secondaryMuscleIds: Yup.array().of(Yup.number()),
  equipmentSlots: Yup.array().of(
    Yup.object({
      slotIndex: Yup.number().required(),
      isRequired: Yup.boolean(),
      comment: Yup.string(),
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
  const {id} = useParams<{id: string}>();
  const navigate = useNavigate();
  const {getMyExercises, updateExercise} = useExercise();

  const {data, loading} = getMyExercises();

  useEffect(() => {
    if (!id) navigate('/exercise');
  }, [id]);

  if (loading) {
    return (
      <ScreenLayout variant="centered">
        <LoadingState text="Loading exercise..." />
      </ScreenLayout>
    );
  }

  const exercise = data?.getExercises.find(
    (e: Exercise) => e.id === Number(id),
  );
  if (!exercise) {
    return (
      <ScreenLayout variant="centered">
        <Title text="Exercise not found." />
      </ScreenLayout>
    );
  }

  const initialValues: UpdateExerciseInput = {
    name: exercise.name,
    description: exercise.description ?? '',
    videoUrl: exercise.videoUrl ?? '',
    difficultyId: exercise.difficulty?.id ?? undefined,
    exerciseTypeId: exercise.exerciseType?.id ?? undefined,
    primaryMuscleIds: exercise.primaryMuscles?.map(m => m.id) ?? [],
    secondaryMuscleIds: exercise.secondaryMuscles?.map(m => m.id) ?? [],
    equipmentSlots:
      exercise.equipmentSlots?.map(slot => ({
        slotIndex: slot.slotIndex,
        isRequired: slot.isRequired,
        comment: slot.comment,
        options: slot.options.map(opt => ({
          subcategoryId: opt.subcategory.id,
          name: opt.subcategory.name, // optional, for display only
        })),
      })) ?? [],
  };

  const handleSubmit = async (
    values: UpdateExerciseInput,
    {setSubmitting}: {setSubmitting: (val: boolean) => void},
  ) => {
    try {
      const payload = {
        ...values,
        videoUrl: values.videoUrl?.trim() || undefined,
      };

      await updateExercise({
        variables: {id: Number(id), input: payload},
      });
      Toast.show({type: 'success', text1: 'Exercise updated!'});
      navigate('/exercise');
    } catch (err) {
      console.error('Error updating exercise', err);
      Toast.show({type: 'error', text1: 'Failed to update exercise'});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout scroll>
      <Title text="Edit Exercise" />
      <Formik
        initialValues={initialValues}
        validationSchema={ExerciseSchema}
        onSubmit={handleSubmit}
        enableReinitialize>
        {({handleSubmit, isSubmitting}) => (
          <>
            <ExerciseForm />
            {/* Submit / Cancel – main form actions */}
            <DividerWithLabel label="Continue with" />

            <ButtonRow>
              <Button
                text="Cancel"
                fullWidth
                onPress={() => navigate('/exercise')}
              />
              <Button
                text="Update"
                fullWidth
                onPress={handleSubmit}
                disabled={isSubmitting}
              />
            </ButtonRow>
          </>
        )}
      </Formik>
    </ScreenLayout>
  );
}
