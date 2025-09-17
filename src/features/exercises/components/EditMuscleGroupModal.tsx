import React, { useState, useEffect } from 'react';
import { ScrollView, View } from 'react-native';

import Button from 'shared/components/Button';
import ButtonRow from 'shared/components/ButtonRow';
import ClickableList from 'shared/components/ClickableList';
import FormInput from 'shared/components/FormInput';
import Title from 'shared/components/Title';
import { spacing } from 'shared/theme/tokens';

interface BodyPart {
  id: number;
  name: string;
}

export interface MuscleGroup {
  id: number;
  name: string;
  bodyParts: BodyPart[];
}

interface Props {
  visible: boolean;
  muscleGroup: MuscleGroup;
  bodyPartOptions: BodyPart[];
  onClose: () => void;
  onSave: (name: string, bodyPartIds: number[]) => void;
}

export default function EditMuscleGroupModal({
  visible,
  muscleGroup,
  bodyPartOptions,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState(muscleGroup.name);
  const [selectedBodyParts, setSelectedBodyParts] = useState<number[]>(
    muscleGroup.bodyParts.map((bp) => bp.id),
  );

  // Sync initial state on open
  useEffect(() => {
    if (visible) {
      setName(muscleGroup.name);
      setSelectedBodyParts(muscleGroup.bodyParts.map((bp) => bp.id));
    }
  }, [visible, muscleGroup]);

  return (
    <>
      <Title text="Edit Muscle Group" />

      <FormInput label="Name" value={name} onChangeText={setName} />

      <Title text="Assign Body Parts" />
      <ScrollView style={{ maxHeight: 300 }}>
        <ClickableList
          items={bodyPartOptions
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((bp) => {
              const selected = selectedBodyParts.includes(bp.id);
              return {
                id: bp.id,
                label: bp.name,
                selected,
                onPress: () => {
                  setSelectedBodyParts((prev) =>
                    selected ? prev.filter((id) => id !== bp.id) : [...prev, bp.id],
                  );
                },
              };
            })}
        />
      </ScrollView>
      <View style={{ marginTop: spacing.md }}>
        <ButtonRow>
          <Button text="Cancel" fullWidth onPress={onClose} />
          <Button
            text="Save"
            fullWidth
            onPress={() => onSave(name, selectedBodyParts)}
            disabled={!name.trim()}
          />
        </ButtonRow>
      </View>
    </>
  );
}
