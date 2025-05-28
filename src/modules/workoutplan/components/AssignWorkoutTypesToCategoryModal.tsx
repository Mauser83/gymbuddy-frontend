import React from 'react';
import {ScrollView, View} from 'react-native';
import ModalWrapper from 'shared/components/ModalWrapper';
import Title from 'shared/components/Title';
import ClickableList from 'shared/components/ClickableList';
import Button from 'shared/components/Button';
import ButtonRow from 'shared/components/ButtonRow';
import {spacing} from 'shared/theme/tokens';

interface WorkoutType {
  id: number;
  name: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  workoutTypes: WorkoutType[];
  selectedTypeIds: number[];
  onChange: (ids: number[]) => void;
  onSave: () => void;
  onManage: () => void;
}

export default function AssignWorkoutTypesToCategoryModal({
  visible,
  onClose,
  workoutTypes,
  selectedTypeIds,
  onChange,
  onSave,
  onManage,
}: Props) {
  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <Title text="Assign Workout Types" />
      <ScrollView>
        <ClickableList
          items={workoutTypes
            .slice() // to avoid mutating the original array
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(type => {
              const selected = selectedTypeIds.includes(type.id);
              return {
                id: type.id,
                label: type.name,
                selected,
                onPress: () => {
                  const newIds = selected
                    ? selectedTypeIds.filter(id => id !== type.id)
                    : [...selectedTypeIds, type.id];
                  onChange(newIds);
                },
              };
            })}
        />
      </ScrollView>
      <View style={{marginTop: spacing.md}}>
        <ButtonRow>
          <Button text="Cancel" fullWidth onPress={onClose} />
          <Button text="Save" fullWidth onPress={onSave} />
        </ButtonRow>
      </View>
      <View style={{marginTop: spacing.md}}>
        <Button text="Manage Workout Types" onPress={onManage} />
      </View>
    </ModalWrapper>
  );
}
