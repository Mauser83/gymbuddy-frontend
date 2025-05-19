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
  equipmentIds: Yup.array().of(Yup.number()),
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

  const exercise = data?.getMyExercises.find(
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
    equipmentIds: exercise.equipments?.map(e => e.id) ?? [],
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
            <Button
              text="Update Exercise"
              onPress={handleSubmit}
              disabled={isSubmitting}
            />
          </>
        )}
      </Formik>
    </ScreenLayout>
  );
}
