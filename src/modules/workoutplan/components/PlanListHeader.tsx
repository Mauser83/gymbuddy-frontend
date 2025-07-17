import React from 'react';
import {View} from 'react-native';
import {FormikProps} from 'formik';
import Title from 'shared/components/Title';
import Card from 'shared/components/Card';
import FormInput from 'shared/components/FormInput';
import SelectableField from 'shared/components/SelectableField';
import Button from 'shared/components/Button';
import {spacing} from 'shared/theme/tokens';
import {FormValues} from '../types/plan.types';

import type {ActiveModal} from '../screens/WorkoutPlanBuilderScreen';

export type PlanListHeaderProps = {
  isEdit: boolean;
  formik: FormikProps<FormValues>;
  workoutMeta: any;
  setActiveModal: React.Dispatch<React.SetStateAction<ActiveModal>>;
  groupIdCounterRef: React.MutableRefObject<number>;
  setStagedGroupId: (id: number | null) => void;
  reorderMode: boolean;
  setReorderMode: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function PlanListHeader({
  isEdit,
  formik,
  workoutMeta,
  setActiveModal,
  groupIdCounterRef,
  setStagedGroupId,
  reorderMode,
  setReorderMode,
}: PlanListHeaderProps) {
  const {values, errors, touched, handleChange, handleBlur} = formik;
  return (
    <>
      <Title
        text={isEdit ? 'Edit Workout Plan' : 'Build Workout Plan'}
        subtitle={
          isEdit ? 'Modify your existing workout session' : 'Create a reusable workout session'
        }
      />
      <Card title="Plan Details">
        <FormInput
          label="Plan Name"
          value={values.name}
          onChangeText={handleChange('name')}
          onBlur={() => handleBlur('name')}
          error={touched.name && errors.name ? (errors.name as string) : undefined}
        />
        <SelectableField
          label="Training Goal"
          value={
            workoutMeta?.getTrainingGoals?.find((goal: any) => goal.id === values.trainingGoalId)?.name ||
            'Select Training Goal'
          }
          onPress={() => setActiveModal('trainingGoalPicker')}
        />
        <SelectableField
          label="Planned Difficulty"
          value={
            values.experienceLevel
              ? values.experienceLevel.charAt(0) + values.experienceLevel.slice(1).toLowerCase()
              : 'Select Difficulty'
          }
          onPress={() => setActiveModal('difficultyPicker')}
        />
        <SelectableField
          label="Muscle Groups"
          value={
            values.muscleGroupIds.length > 0
              ? `${values.muscleGroupIds.length} selected`
              : 'Select Muscle Groups'
          }
          onPress={() => setActiveModal('muscleGroupPicker')}
          disabled={!values.trainingGoalId}
        />
      </Card>
      <View style={{padding: spacing.md}}>
        <Title text="Exercises" />
        <View style={{marginVertical: spacing.sm}}>
          <Button
            text="Create Exercise Group"
            onPress={() => {
              setStagedGroupId(groupIdCounterRef.current++);
              setActiveModal('groupMethodPicker');
            }}
          />
        </View>
        <Button
          text={reorderMode ? 'Done Reordering' : 'Edit Order'}
          disabled={values.exercises.length < 1}
          onPress={() => setReorderMode(prev => !prev)}
        />
      </View>
    </>
  );
}