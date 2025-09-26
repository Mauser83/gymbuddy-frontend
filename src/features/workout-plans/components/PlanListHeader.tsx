import { FormikProps } from 'formik';
import React from 'react';
import { View } from 'react-native';

import Button from 'src/shared/components/Button';
import Card from 'src/shared/components/Card';
import FormInput from 'src/shared/components/FormInput';
import SelectableField from 'src/shared/components/SelectableField';
import Title from 'src/shared/components/Title';
import { spacing } from 'src/shared/theme/tokens';

import type { ActiveModal } from '../types/modal.types';
import { FormValues } from '../types/plan.types';

type WritableRef<T> = { current: T };

export type PlanListHeaderProps = {
  isEdit: boolean;
  formik: FormikProps<FormValues>;
  workoutMeta: any;
  setActiveModal: React.Dispatch<React.SetStateAction<ActiveModal>>;
  groupIdCounterRef: WritableRef<number>;
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
  const { values, errors, touched, handleChange, handleBlur } = formik;
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
            workoutMeta?.getTrainingGoals?.find((goal: any) => goal.id === values.trainingGoalId)
              ?.name || 'Select Training Goal'
          }
          onPress={() => setActiveModal('trainingGoalPicker')}
        />
        <SelectableField
          label="Planned Difficulty"
          value={
            workoutMeta?.experienceLevels?.find((l: any) => l.id === values.experienceLevelId)
              ?.name || 'Select Difficulty'
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
      <View style={{ padding: spacing.md }}>
        <Title text="Exercises" />
        <View style={{ marginVertical: spacing.sm }}>
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
          onPress={() => setReorderMode((prev) => !prev)}
        />
      </View>
    </>
  );
}
