import React, { useEffect, useState } from 'react';
import { ScrollView, Dimensions, View } from 'react-native';
import ModalWrapper from 'shared/components/ModalWrapper';
import Title from 'shared/components/Title';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import ClickableList from 'shared/components/ClickableList';
import ButtonRow from 'shared/components/ButtonRow';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme } from 'shared/theme/ThemeProvider';

import { useReferenceManagement } from '../hooks/useReferenceManagement';
import { BodyPart, ExerciseDifficulty, ExerciseType, Muscle } from '../types/exercise.types';
import DividerWithLabel from 'shared/components/DividerWithLabel';

type Mode = 'type' | 'difficulty' | 'bodyPart' | 'muscle';
type ReferenceItem = ExerciseType | ExerciseDifficulty | BodyPart | Muscle;

interface ManageReferenceModalProps {
  visible: boolean;
  onClose: () => void;
  mode: Mode;
  bodyPartId?: number;
}

export default function ManageReferenceModal({
  visible,
  onClose,
  mode,
  bodyPartId,
}: ManageReferenceModalProps) {
  const { theme } = useTheme();
  const screenHeight = Dimensions.get('window').height;
  const modalHeight = screenHeight * 0.8;

  const isManagingMuscles = mode === 'muscle';
  const [viewStep, setViewStep] = useState<'bodyPart' | 'muscle'>(isManagingMuscles && bodyPartId ? 'muscle' : 'bodyPart');
  const [selectedBodyPartId, setSelectedBodyPartId] = useState<number | null>(bodyPartId || null);

  const currentMode = isManagingMuscles && viewStep === 'bodyPart' ? 'bodyPart' : mode;

  const {
    data,
    refetch,
    createItem,
    updateItem,
    deleteItem,
  } = useReferenceManagement(currentMode, selectedBodyPartId || undefined);

  useEffect(() => {
    if (visible) {
      refetch();
    }
  }, [visible, viewStep, selectedBodyPartId]);

  const [newValue, setNewValue] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [edits, setEdits] = useState<{ [id: number]: string }>({});

  const handleCreate = async () => {
    try {
      await createItem(newValue);
      setNewValue('');
      await refetch();
    } catch (err) {
      console.error('Error creating', err);
    }
  };

  const handleUpdate = async (id: number, value: string) => {
    try {
      await updateItem(id, value);
      await refetch();
    } catch (err) {
      console.error('Error updating', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteItem(id);
      await refetch();
    } catch (err) {
      console.error('Error deleting', err);
    }
  };

  const titleMap: Record<Mode, string> = {
    type: 'Exercise Types',
    difficulty: 'Exercise Difficulties',
    bodyPart: 'Body Parts',
    muscle: 'Muscles',
  };

  const items = (data || []).slice().sort((a: ReferenceItem, b: ReferenceItem) => {
    const aVal = 'name' in a ? a.name : 'level' in a ? a.level : '';
    const bVal = 'name' in b ? b.name : 'level' in b ? b.level : '';
    return aVal.localeCompare(bVal);
  }).map((item: ReferenceItem) => {
    const label = 'name' in item ? item.name : 'level' in item ? item.level : '';

    return {
      id: item.id,
      label,
      selected: expandedId === item.id,
      rightElement: expandedId === item.id ? (
        <FontAwesome name="chevron-down" size={16} color={theme.colors.accentStart} />
      ) : null,
      onPress: () => {
        if (isManagingMuscles && viewStep === 'bodyPart') {
          setSelectedBodyPartId(item.id);
          setViewStep('muscle');
        } else {
          setExpandedId(prev => (prev === item.id ? null : item.id));
          setEdits(prev => ({ ...prev, [item.id]: label }));
        }
      },
      content: expandedId === item.id ? (
        <>
          <FormInput
            label="Name"
            value={edits[item.id] || ''}
            onChangeText={val => setEdits(prev => ({ ...prev, [item.id]: val }))}
          />
          <ButtonRow>
            <Button
              text="Update"
              fullWidth
              disabled={!edits[item.id] || edits[item.id] === label}
              onPress={() => handleUpdate(item.id, edits[item.id] || label)}
            />
            <Button text="Delete" fullWidth onPress={() => handleDelete(item.id)} />
          </ButtonRow>
        </>
      ) : undefined,
    };
  });

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <Title
        text={
          isManagingMuscles && viewStep === 'bodyPart'
            ? 'Select a Body Part to Manage Muscles'
            : `Manage ${titleMap[currentMode]}`
        }
      />

      <FormInput
        label={`New ${titleMap[currentMode].slice(0, -1)}`}
        value={newValue}
        onChangeText={setNewValue}
      />
      <Button text="Create" onPress={handleCreate} />

      <ScrollView style={{ maxHeight: modalHeight - 250 }}>
        <ClickableList items={items} />
      </ScrollView>
    </ModalWrapper>
  );
}
