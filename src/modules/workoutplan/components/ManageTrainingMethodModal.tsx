import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTheme } from 'shared/theme/ThemeProvider';
import { useMutation } from '@apollo/client';
import Title from 'shared/components/Title';
import Button from 'shared/components/Button';
import ButtonRow from 'shared/components/ButtonRow';
import ClickableList from 'shared/components/ClickableList';
import FormInput from 'shared/components/FormInput';
import {
  CREATE_TRAINING_METHOD,
  UPDATE_TRAINING_METHOD,
  DELETE_TRAINING_METHOD,
} from '../graphql/workoutReferences';

interface TrainingMethod {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  methods: TrainingMethod[];
  refetch: () => Promise<any>;
}

export default function ManageTrainingMethodModal({ visible, onClose, methods, refetch }: Props) {
  const { theme } = useTheme();
  const [createMethod] = useMutation(CREATE_TRAINING_METHOD);
  const [updateMethod] = useMutation(UPDATE_TRAINING_METHOD);
  const [deleteMethod] = useMutation(DELETE_TRAINING_METHOD);

  const [newValue, setNewValue] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, string>>({});

  const handleCreate = async () => {
    if (!newValue.trim()) return;
    await createMethod({
      variables: {
        input: {
          name: newValue,
          slug: newValue.toLowerCase().replace(/\s+/g, '-'),
        },
      },
    });
    setNewValue('');
    await refetch();
  };

  const handleUpdate = async (id: number, name: string) => {
    await updateMethod({
      variables: {
        id,
        input: {
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
        },
      },
    });
    await refetch();
    setExpandedId(null);
    setEdits(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleDelete = async (id: number) => {
    await deleteMethod({ variables: { id } });
    await refetch();
  };

  const listItems = methods
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(method => {
      const isExpanded = expandedId === method.id;
      const currentEdit = edits[method.id] ?? method.name;

      return {
        id: method.id,
        label: method.name,
        selected: isExpanded,
        onPress: () => {
          setExpandedId(prev => (prev === method.id ? null : method.id));
          setEdits(prev => ({ ...prev, [method.id]: method.name }));
        },
        content: isExpanded ? (
          <View style={{ gap: 12 }}>
            <FormInput
              label="Edit Name"
              value={currentEdit}
              onChangeText={text =>
                setEdits(prev => ({ ...prev, [method.id]: text }))
              }
            />
            <ButtonRow>
              <Button
                text="Update"
                fullWidth
                onPress={() => handleUpdate(method.id, currentEdit)}
              />
              <Button
                text="Delete"
                fullWidth
                onPress={() => handleDelete(method.id)}
              />
            </ButtonRow>
          </View>
        ) : undefined,
      };
    });

  return (
    <View>
      <Title text="Manage Training Methods" />
      <FormInput
        label="New Method Name"
        value={newValue}
        onChangeText={setNewValue}
      />
      <ButtonRow>
        <Button text="Close" fullWidth onPress={onClose} />
        <Button text="Create" fullWidth onPress={handleCreate} />
      </ButtonRow>
      <ScrollView>
        <ClickableList items={listItems} />
      </ScrollView>
    </View>
  );
}
