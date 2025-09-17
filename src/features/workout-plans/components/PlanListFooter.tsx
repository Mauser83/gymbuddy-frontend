import React from 'react';
import { View } from 'react-native';

import Button from 'shared/components/Button';
import { spacing } from 'shared/theme/tokens';

import type { ActiveModal } from '../types/modal.types';

export type PlanListFooterProps = {
  isEdit: boolean;
  onSubmit: () => void;
  setActiveModal: React.Dispatch<React.SetStateAction<ActiveModal>>;
};

export default function PlanListFooter({ isEdit, onSubmit, setActiveModal }: PlanListFooterProps) {
  return (
    <View style={{ padding: spacing.md }}>
      <View style={{ paddingBottom: spacing.md }}>
        <Button text="Add Exercise" onPress={() => setActiveModal('selectExercise')} />
      </View>
      <Button text={isEdit ? 'Update Plan' : 'Save Plan'} onPress={onSubmit} />
    </View>
  );
}
