import { useMutation } from '@apollo/client';
import { Formik } from 'formik';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-native';
import * as Yup from 'yup';

import { useAuth } from 'features/auth/context/AuthContext';
import { Gym } from 'features/gyms/types/gym.types';
import GymPickerModal from 'features/workout-sessions/components/GymPickerModal';
import WorkoutPlanPickerModal, {
  WorkoutPlan,
} from 'features/workout-sessions/components/WorkoutPlanPickerModal';
import { CREATE_WORKOUT_SESSION } from 'features/workout-sessions/graphql/userWorkouts.graphql';
import Button from 'shared/components/Button';
import FormError from 'shared/components/FormError';
import LoadingState from 'shared/components/LoadingState';
import ModalWrapper from 'shared/components/ModalWrapper';
import ScreenLayout from 'shared/components/ScreenLayout';
import SelectableField from 'shared/components/SelectableField';
import Title from 'shared/components/Title';

const validationSchema = Yup.object().shape({
  gym: Yup.object().required('Please select a gym'),
  plan: Yup.object().nullable(),
});

export default function StartWorkoutScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [gymModalVisible, setGymModalVisible] = useState(false);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [createSession] = useMutation(CREATE_WORKOUT_SESSION);

  return (
    <ScreenLayout>
      <Title text="Start Workout" subtitle="Set up your session" />

      <Formik
        initialValues={{
          gym: null as Gym | null,
          plan: null as WorkoutPlan | null,
        }}
        validationSchema={validationSchema}
        onSubmit={async (values, { setSubmitting, setErrors }) => {
          if (!user?.id) {
            setErrors({ gym: 'User not authenticated.' });
            return;
          }

          try {
            const { data } = await createSession({
              variables: {
                input: {
                  userId: user.id,
                  gymId: values.gym?.id,
                  startedAt: new Date().toISOString(),
                  workoutPlanId: values.plan?.id ?? null,
                  notes: null,
                },
              },
            });

            navigate(`/active-session/${data.createWorkoutSession.id}`);
          } catch (err) {
            console.error(err);
            setErrors({ gym: 'Failed to start session — please try again.' });
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ handleSubmit, setFieldValue, values, errors, isSubmitting }) => (
          <>
            <SelectableField
              label="Gym"
              value={values.gym?.name || 'Select gym'}
              onPress={() => setGymModalVisible(true)}
            />
            <SelectableField
              label="Workout Plan (Optional)"
              value={values.plan?.name || 'No plan selected'}
              onPress={() => setPlanModalVisible(true)}
            />

            {errors.gym && <FormError message={errors.gym} />}
            {isSubmitting ? (
              <LoadingState text="Creating session..." />
            ) : (
              <Button text="Start Workout" onPress={handleSubmit} />
            )}

            <ModalWrapper
              visible={gymModalVisible || planModalVisible}
              onClose={() => {
                setGymModalVisible(false);
                setPlanModalVisible(false);
              }}
            >
              {gymModalVisible && (
                <GymPickerModal
                  onClose={() => setGymModalVisible(false)}
                  onSelect={(gym) => {
                    setFieldValue('gym', gym);
                    setGymModalVisible(false);
                  }}
                />
              )}
              {planModalVisible && (
                <WorkoutPlanPickerModal
                  onClose={() => setPlanModalVisible(false)}
                  onSelect={(plan) => {
                    setFieldValue('plan', plan);
                    setPlanModalVisible(false);
                  }}
                />
              )}
            </ModalWrapper>
          </>
        )}
      </Formik>
    </ScreenLayout>
  );
}
