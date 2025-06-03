import React from 'react';
import { ScrollView, View } from 'react-native';
import Title from 'shared/components/Title';
import OptionItem from 'shared/components/OptionItem';
import Button from 'shared/components/Button';
import ModalWrapper from 'shared/components/ModalWrapper';
import { spacing } from 'shared/theme/tokens';
import { useAuth } from 'modules/auth/context/AuthContext';

interface Props {
  visible: boolean;
  trainingGoals: { id: number; name: string }[];
  selectedId?: number;
  onSelect: (id: number) => void;
  onManage?: () => void;
  onClose: () => void;
}

export default function TrainingGoalPickerModal({
  visible,
  trainingGoals,
  selectedId,
  onSelect,
  onManage,
  onClose,
}: Props) {
  const { user } = useAuth();

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <Title text="Select Training Goal" />
      <ScrollView>
        {trainingGoals
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(goal => (
            <OptionItem
              key={goal.id}
              text={goal.name}
              selected={goal.id === selectedId}
              onPress={() => onSelect(goal.id)}
            />
          ))}
      </ScrollView>

      <View style={{ marginTop: spacing.md }}>
        <Button text="Close" onPress={onClose} />
      </View>

      {user && (user.appRole === 'ADMIN' || user.appRole === 'MODERATOR') && onManage && (
        <View style={{ marginTop: spacing.md }}>
          <Button text="Manage Training Goals" onPress={onManage} />
        </View>
      )}
    </ModalWrapper>
  );
}
