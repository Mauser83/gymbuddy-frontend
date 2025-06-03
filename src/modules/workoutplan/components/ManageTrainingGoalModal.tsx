import React, { useState } from 'react';
import { ScrollView, View, Dimensions } from 'react-native';
import Title from 'shared/components/Title';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import ClickableList from 'shared/components/ClickableList';
import ButtonRow from 'shared/components/ButtonRow';
import { useTheme } from 'shared/theme/ThemeProvider';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {
  CREATE_TRAINING_GOAL,
  UPDATE_TRAINING_GOAL,
  DELETE_TRAINING_GOAL,
} from '../graphql/workoutReferences';
import { useMutation } from '@apollo/client';
import { spacing } from 'shared/theme/tokens';

interface Props {
  visible: boolean;
  onClose: () => void;
  items: { id: number; name: string; slug?: string }[];
  refetch: () => Promise<any>;
}

export default function ManageTrainingGoalModal({
  visible,
  onClose,
  items,
  refetch,
}: Props) {
  const { theme } = useTheme();
  const screenHeight = Dimensions.get('window').height;
  const modalHeight = screenHeight * 0.8;

  const [newValue, setNewValue] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, string>>({});

  const [createTrainingGoal] = useMutation(CREATE_TRAINING_GOAL);
  const [updateTrainingGoal] = useMutation(UPDATE_TRAINING_GOAL);
  const [deleteTrainingGoal] = useMutation(DELETE_TRAINING_GOAL);

  const handleCreate = async () => {
    try {
      await createTrainingGoal({
        variables: {
          input: {
            name: newValue,
            slug: newValue.toLowerCase().replace(/\s+/g, '-'),
          },
        },
      });
      setNewValue('');
      await refetch();
    } catch (err) {
      console.error('Create error:', err);
    }
  };

  const handleUpdate = async (id: number, value: string) => {
    try {
      await updateTrainingGoal({
        variables: {
          id,
          input: {
            name: value,
            slug: value.toLowerCase().replace(/\s+/g, '-'),
          },
        },
      });
      setExpandedId(null);
      setEdits(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      await refetch();
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTrainingGoal({ variables: { id } });
      await refetch();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const listItems = items
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(item => {
      const isExpanded = expandedId === item.id;
      const currentEditValue = edits[item.id] ?? item.name;

      return {
        id: item.id,
        label: item.name,
        selected: isExpanded,
        rightElement: isExpanded ? (
          <FontAwesome
            name="chevron-down"
            size={16}
            color={theme.colors.accentStart}
          />
        ) : null,
        onPress: () => {
          setExpandedId(prev => (prev === item.id ? null : item.id));
          setEdits(prev => ({ ...prev, [item.id]: item.name }));
        },
        content: isExpanded ? (
          <View style={{ gap: spacing.sm }}>
            <FormInput
              label="Edit Name"
              value={currentEditValue}
              onChangeText={text =>
                setEdits(prev => ({ ...prev, [item.id]: text }))
              }
            />
            <ButtonRow>
              <Button
                text="Update"
                fullWidth
                onPress={() => handleUpdate(item.id, currentEditValue)}
                disabled={
                  currentEditValue.trim() === '' ||
                  currentEditValue === item.name
                }
              />
              <Button
                text="Delete"
                fullWidth
                onPress={() => handleDelete(item.id)}
              />
            </ButtonRow>
          </View>
        ) : undefined,
      };
    });

  return (
    <>
      <Title text="Manage Training Goals" />
      <FormInput
        label="New Training Goal"
        value={newValue}
        onChangeText={setNewValue}
      />
      <ButtonRow>
        <Button text="Close" fullWidth onPress={onClose} />
        <Button text="Create" fullWidth onPress={handleCreate} />
      </ButtonRow>
      <View style={{ height: modalHeight - 250 }}>
        <ScrollView showsVerticalScrollIndicator={true}>
          <ClickableList items={listItems} />
        </ScrollView>
      </View>
    </>
  );
}
