import React from 'react';
import {useNavigate} from 'react-router-native';
import {Formik} from 'formik';
import * as Yup from 'yup';

import {useExercise} from '../../features/exercises/hooks/useExercise';
import {CreateExerciseInput} from '../../features/exercises/types/exercise.types';

import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Button from 'shared/components/Button';
import ExerciseForm from 'features/exercises/components/ExerciseForm';
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

const initialValues: CreateExerciseInput = {
  name: '',
  description: '',
  videoUrl: '',
  difficultyId: undefined,
  exerciseTypeId: undefined,
  primaryMuscleIds: [],
  secondaryMuscleIds: [],
  equipmentSlots: [], // ✅ NEW
};

export default function CreateExerciseScreen() {
  const navigate = useNavigate();
  const {createExercise} = useExercise();

  const handleSubmit = async (
    values: CreateExerciseInput,
    {setSubmitting}: {setSubmitting: (val: boolean) => void},
  ) => {
    try {
      const payload = {
        ...values,
        videoUrl: values.videoUrl?.trim() || undefined,
        equipmentSlots: values.equipmentSlots.map((slot, index) => ({
          ...slot,
          slotIndex: index,
        })),
      };

      await createExercise({variables: {input: payload}});
      Toast.show({type: 'success', text1: 'Exercise created!'});
      navigate('/exercise');
    } catch (err) {
      console.error('Error creating exercise', err);
      Toast.show({type: 'error', text1: 'Failed to create exercise'});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout scroll>
      <Title text="Create New Exercise" />
      <Formik
        initialValues={initialValues}
        validationSchema={ExerciseSchema}
        onSubmit={handleSubmit}>
        {({handleSubmit, isSubmitting, errors, values}) => {
          return (
            <>
              <ExerciseForm />
              <DividerWithLabel label="Continue with" />
              <ButtonRow>
                <Button
                  text="Cancel"
                  fullWidth
                  onPress={() => navigate('/exercise')}
                />
                <Button
                  text="Create Exercise"
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  fullWidth
                />
              </ButtonRow>
            </>
          );
        }}
      </Formik>
    </ScreenLayout>
  );
}
