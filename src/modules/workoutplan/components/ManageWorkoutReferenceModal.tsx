import React, {useState, useEffect} from 'react';
import {ScrollView, Dimensions} from 'react-native';
import ModalWrapper from 'shared/components/ModalWrapper';
import Title from 'shared/components/Title';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import ClickableList from 'shared/components/ClickableList';
import ButtonRow from 'shared/components/ButtonRow';
import {useTheme} from 'shared/theme/ThemeProvider';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {
  CREATE_WORKOUT_TYPE,
  UPDATE_WORKOUT_TYPE,
  DELETE_WORKOUT_TYPE,
  CREATE_MUSCLE_GROUP,
  UPDATE_MUSCLE_GROUP,
  DELETE_MUSCLE_GROUP,
  CREATE_WORKOUT_CATEGORY,
  UPDATE_WORKOUT_CATEGORY,
  DELETE_WORKOUT_CATEGORY,
  CREATE_TRAINING_METHOD,
  UPDATE_TRAINING_METHOD,
  DELETE_TRAINING_METHOD,
} from '../graphql/workoutReferences';
import {useMutation} from '@apollo/client';

interface ReferenceItem {
  id: number;
  name: string;
  slug?: string;
  description?: string;
}

type Mode =
  | 'workoutType'
  | 'muscleGroup'
  | 'workoutCategory'
  | 'trainingMethod';

interface ManageWorkoutReferenceModalProps {
  visible: boolean;
  onClose: () => void;
  mode: Mode;
  items: ReferenceItem[];
  refetch: () => Promise<any>;
  categoryId?: number;
  categoryTypeIds: number[];
  bodyPartOptions?: {id: number; name: string}[];
}

const titleMap: Record<Mode, string> = {
  workoutType: 'Workout Types',
  muscleGroup: 'Muscle Groups',
  workoutCategory: 'Workout Categories',
  trainingMethod: 'Training Methods',
};

const mutationMap: Record<Mode, {create: any; update: any; delete: any}> = {
  workoutType: {
    create: CREATE_WORKOUT_TYPE,
    update: UPDATE_WORKOUT_TYPE,
    delete: DELETE_WORKOUT_TYPE,
  },
  muscleGroup: {
    create: CREATE_MUSCLE_GROUP,
    update: UPDATE_MUSCLE_GROUP,
    delete: DELETE_MUSCLE_GROUP,
  },
  workoutCategory: {
    create: CREATE_WORKOUT_CATEGORY,
    update: UPDATE_WORKOUT_CATEGORY,
    delete: DELETE_WORKOUT_CATEGORY,
  },
  trainingMethod: {
    create: CREATE_TRAINING_METHOD,
    update: UPDATE_TRAINING_METHOD,
    delete: DELETE_TRAINING_METHOD,
  },
};

export default function ManageWorkoutReferenceModal({
  visible,
  onClose,
  mode,
  items,
  refetch,
  categoryId,
  bodyPartOptions,
}: ManageWorkoutReferenceModalProps) {
  const {theme} = useTheme();
  const screenHeight = Dimensions.get('window').height;
  const modalHeight = screenHeight * 0.8;

  const [newValue, setNewValue] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [selectedBodyParts, setSelectedBodyParts] = useState<number[]>([]);

  const [createItem] = useMutation(mutationMap[mode].create);
  const [updateItem] = useMutation(mutationMap[mode].update);
  const [deleteItem] = useMutation(mutationMap[mode].delete);

  const handleCreate = async () => {
    try {
      const baseInput = {
        name: newValue,
        slug: newValue.toLowerCase().replace(/\s+/g, '-'),
      };

      const createPayload =
        mode === 'workoutType' && categoryId
          ? {...baseInput, categoryIds: [categoryId]}
          : mode === 'muscleGroup'
            ? {...baseInput, bodyPartIds: selectedBodyParts}
            : baseInput;

      await createItem({
        variables: {
          input: createPayload,
        },
      });

      setNewValue('');
      await refetch();
      if (mode === 'muscleGroup') {
        setSelectedBodyParts([]);
      }
    } catch (err) {
      console.error('Create error:', err);
    }
  };

  const handleUpdate = async (id: number, value: string) => {
    try {
      const baseInput = {
        name: value,
        slug: value.toLowerCase().replace(/\s+/g, '-'),
      };

      const updatePayload =
        mode === 'workoutType' && categoryId
          ? {...baseInput, categoryIds: [categoryId]}
          : mode === 'muscleGroup'
            ? {...baseInput, bodyPartIds: selectedBodyParts}
            : baseInput;

      await updateItem({
        variables: {
          id,
          input: updatePayload,
        },
      });

      await refetch();
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteItem({variables: {id}});
      await refetch();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const listItems = items.map((item: ReferenceItem) => {
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
        setEdits(prev => ({...prev, [item.id]: item.name}));
      },
      content: isExpanded ? (
        <>
          <FormInput
            label="Edit Name"
            value={currentEditValue}
            onChangeText={val => setEdits(prev => ({...prev, [item.id]: val}))}
          />
          <ButtonRow>
            <Button
              text="Update"
              fullWidth
              disabled={!currentEditValue || currentEditValue === item.name}
              onPress={() => handleUpdate(item.id, currentEditValue)}
            />
            <Button
              text="Delete"
              fullWidth
              onPress={() => handleDelete(item.id)}
            />
          </ButtonRow>
        </>
      ) : undefined,
    };
  });

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <Title text={`Manage ${titleMap[mode]}`} />
      <FormInput
        label={`New ${titleMap[mode].slice(0, -1)}`}
        value={newValue}
        onChangeText={setNewValue}
      />
      <ButtonRow>
        <Button text="Close" fullWidth onPress={onClose} />
        <Button text="Create" fullWidth onPress={handleCreate} />
      </ButtonRow>
      {mode === 'muscleGroup' &&
        bodyPartOptions &&
        bodyPartOptions.length > 0 && (
          <>
            <Title text="Assign Body Parts" />
            <ScrollView>
              <ClickableList
                items={bodyPartOptions
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(bp => {
                    const selected = selectedBodyParts.includes(bp.id);
                    return {
                      id: bp.id,
                      label: bp.name,
                      selected,
                      onPress: () => {
                        setSelectedBodyParts(prev =>
                          selected
                            ? prev.filter(id => id !== bp.id)
                            : [...prev, bp.id],
                        );
                      },
                    };
                  })}
              />
            </ScrollView>
          </>
        )}
      <ScrollView style={{maxHeight: modalHeight - 250}}>
        <ClickableList items={listItems} />
      </ScrollView>
    </ModalWrapper>
  );
}
