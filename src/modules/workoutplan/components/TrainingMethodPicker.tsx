import React from 'react';
import { ScrollView, View } from 'react-native';
import Title from 'shared/components/Title';
import Button from 'shared/components/Button';
import OptionItem from 'shared/components/OptionItem';
import { spacing } from 'shared/theme/tokens';
import { useTheme } from 'shared/theme/ThemeProvider';
import { useAuth } from 'modules/auth/context/AuthContext';

interface TrainingMethodPickerProps {
  trainingMethods: { id: number; name: string }[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onManage: () => void;
  onClose: () => void;
}

export default function TrainingMethodPicker({
  trainingMethods,
  selectedId,
  onSelect,
  onManage,
  onClose,
}: TrainingMethodPickerProps) {
  const { theme } = useTheme();
  const { user } = useAuth();

  return (
    <>
      <Title text="Select Training Method" />
      <ScrollView>
        {trainingMethods
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(method => (
            <OptionItem
              key={method.id}
              text={method.name}
              selected={selectedId === method.id}
              onPress={() => onSelect(method.id)}
            />
          ))}
      </ScrollView>
      <View style={{ marginTop: spacing.md }}>
        <Button text="Close" onPress={onClose} />
      </View>
      {user && (user.appRole === 'ADMIN' || user.appRole === 'MODERATOR') && (
        <View style={{ marginTop: spacing.md }}>
          <Button text="Manage Training Methods" onPress={onManage} />
        </View>
      )}
    </>
  );
}
