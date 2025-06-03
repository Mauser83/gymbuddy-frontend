import React, {useState} from 'react';
import {ScrollView, View} from 'react-native';
import Title from 'shared/components/Title';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import ButtonRow from 'shared/components/ButtonRow';
import ClickableList from 'shared/components/ClickableList';
import {spacing} from 'shared/theme/tokens';
import {useTheme} from 'shared/theme/ThemeProvider';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useMutation} from '@apollo/client';
import {
  CREATE_MUSCLE_GROUP,
  UPDATE_MUSCLE_GROUP,
  DELETE_MUSCLE_GROUP,
} from '../graphql/workoutReferences';

interface MuscleGroup {
  id: number;
  name: string;
  bodyParts: {id: number; name: string}[];
}

interface ManageMuscleGroupModalProps {
  visible: boolean;
  onClose: () => void;
  items: MuscleGroup[];
  refetch: () => Promise<any>;
  bodyPartOptions: {id: number; name: string}[];
  onEditMuscleGroup: (muscleGroup: MuscleGroup) => void;
}

export default function ManageMuscleGroupModal({
  visible,
  onClose,
  items,
  refetch,
  bodyPartOptions,
  onEditMuscleGroup,
}: ManageMuscleGroupModalProps) {
  const {theme} = useTheme();
  const [newValue, setNewValue] = useState('');
  const [createMuscleGroup] = useMutation(CREATE_MUSCLE_GROUP);
  const [deleteMuscleGroup] = useMutation(DELETE_MUSCLE_GROUP);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleCreate = async () => {
    try {
      await createMuscleGroup({
        variables: {
          input: {
            name: newValue,
            slug: newValue.toLowerCase().replace(/\s+/g, '-'),
            bodyPartIds: [],
          },
        },
      });
      setNewValue('');
      await refetch();
    } catch (err) {
      console.error('Error creating muscle group:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMuscleGroup({variables: {id}});
      await refetch();
    } catch (err) {
      console.error('Error deleting muscle group:', err);
    }
  };

  const listItems = items
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((item: MuscleGroup) => ({
      id: item.id,
      label: item.name,
      selected: expandedId === item.id,
      onPress: () => setExpandedId(prev => (prev === item.id ? null : item.id)),
      onLongPress: () =>
        onEditMuscleGroup?.({
          id: item.id,
          name: item.name,
          bodyParts: item.bodyParts ?? [],
        }),
    }));

  return (
    <>
      <Title text="Manage Muscle Groups" />
      <FormInput
        label="New Muscle Group"
        value={newValue}
        onChangeText={setNewValue}
      />
      <ButtonRow>
        <Button text="Close" fullWidth onPress={onClose} />
        <Button text="Create" fullWidth onPress={handleCreate} />
      </ButtonRow>
      <View style={{marginTop: spacing.md}}>
        <ScrollView>
          <ClickableList items={listItems} />
        </ScrollView>
      </View>
    </>
  );
}
