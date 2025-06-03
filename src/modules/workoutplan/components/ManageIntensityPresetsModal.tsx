import React, {useState, useEffect} from 'react';
import {ScrollView, View, Text} from 'react-native';
import Title from 'shared/components/Title';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import ButtonRow from 'shared/components/ButtonRow';
import ClickableList from 'shared/components/ClickableList';
import {useTheme} from 'shared/theme/ThemeProvider';
import {spacing} from 'shared/theme/tokens';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useMutation} from '@apollo/client';
import {
  CREATE_INTENSITY_PRESET,
  UPDATE_INTENSITY_PRESET,
  DELETE_INTENSITY_PRESET,
} from '../graphql/workoutReferences';
import SelectableField from 'shared/components/SelectableField';
import DividerWithLabel from 'shared/components/DividerWithLabel';

export interface IntensityPreset {
  id: number;
  trainingGoalId: number;
  experienceLevel: string;
  defaultSets: number;
  defaultReps: number;
  defaultRestSec: number;
  defaultRpe: number;
}

interface ManageIntensityPresetsModalProps {
  visible: boolean;
  onClose: () => void;
  presets: IntensityPreset[];
  trainingGoals: {id: number; name: string}[];
  refetch: () => Promise<any>;
  onOpenTrainingGoalPicker: (
    currentDraft: Partial<IntensityPreset>,
    onSelect: (value: number) => void,
  ) => void;
  onOpenExperienceLevelPicker: (
    currentDraft: Partial<IntensityPreset>,
    onSelect: (value: string) => void,
  ) => void;
  newPreset: Partial<IntensityPreset>; // 👈 add this
  setNewPreset: React.Dispatch<React.SetStateAction<Partial<IntensityPreset>>>; // 👈 and this
}
const experienceLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

export default function ManageIntensityPresetsModal({
  visible,
  onClose,
  presets,
  trainingGoals,
  refetch,
  onOpenExperienceLevelPicker,
  onOpenTrainingGoalPicker,
  newPreset,
  setNewPreset,
}: ManageIntensityPresetsModalProps) {
  const {theme} = useTheme();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, Partial<IntensityPreset>>>(
    {},
  );

  const [createPreset] = useMutation(CREATE_INTENSITY_PRESET);
  const [updatePreset] = useMutation(UPDATE_INTENSITY_PRESET);
  const [deletePreset] = useMutation(DELETE_INTENSITY_PRESET);

  console.log('Presets:', presets);

  const handleCreate = async () => {
    try {
      await createPreset({variables: {input: newPreset}});
      setNewPreset({
        trainingGoalId: trainingGoals[0]?.id,
        experienceLevel: 'BEGINNER',
        defaultSets: 3,
        defaultReps: 10,
        defaultRestSec: 60,
        defaultRpe: 8,
      });
      await refetch();
    } catch (err) {
      console.error('Error creating preset:', err);
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      await updatePreset({variables: {id, input: edits[id]}});
      setExpandedId(null);
      setEdits(prev => {
        const updated = {...prev};
        delete updated[id];
        return updated;
      });
      await refetch();
    } catch (err) {
      console.error('Error updating preset:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePreset({variables: {id}});
      await refetch();
    } catch (err) {
      console.error('Error deleting preset:', err);
    }
  };

  const listItems = presets
    .slice()
    .sort((a, b) => a.experienceLevel.localeCompare(b.experienceLevel))
    .map(preset => {
      const isExpanded = expandedId === preset.id;
      const edit = edits[preset.id] || preset;
      const goal = trainingGoals.find(g => g.id === preset.trainingGoalId);

      return {
        id: preset.id,
        label: `${goal?.name || 'Goal'} – ${preset.experienceLevel}`,
        selected: isExpanded,
        rightElement: isExpanded ? (
          <FontAwesome
            name="chevron-down"
            size={16}
            color={theme.colors.accentStart}
          />
        ) : null,
        onPress: () => {
          setExpandedId(prev => (prev === preset.id ? null : preset.id));
          setEdits(prev => ({...prev, [preset.id]: preset}));
        },
        content: isExpanded ? (
          <View style={{gap: spacing.sm}}>
            <FormInput
              label="Sets"
              value={String(edit.defaultSets)}
              keyboardType="numeric"
              onChangeText={v =>
                setEdits(p => ({
                  ...p,
                  [preset.id]: {...edit, defaultSets: Number(v)},
                }))
              }
            />
            <FormInput
              label="Reps"
              value={String(edit.defaultReps)}
              keyboardType="numeric"
              onChangeText={v =>
                setEdits(p => ({
                  ...p,
                  [preset.id]: {...edit, defaultReps: Number(v)},
                }))
              }
            />
            <FormInput
              label="Rest (sec)"
              value={String(edit.defaultRestSec)}
              keyboardType="numeric"
              onChangeText={v =>
                setEdits(p => ({
                  ...p,
                  [preset.id]: {...edit, defaultRestSec: Number(v)},
                }))
              }
            />
            <FormInput
              label="RPE"
              value={String(edit.defaultRpe)}
              keyboardType="numeric"
              onChangeText={v =>
                setEdits(p => ({
                  ...p,
                  [preset.id]: {...edit, defaultRpe: Number(v)},
                }))
              }
            />
            <ButtonRow>
              <Button
                text="Update"
                fullWidth
                onPress={() => handleUpdate(preset.id)}
              />
              <Button
                text="Delete"
                fullWidth
                onPress={() => handleDelete(preset.id)}
              />
            </ButtonRow>
          </View>
        ) : undefined,
      };
    });

  return (
    <View style={{flex: 1}}>
      <ScrollView>
        <Title text="Manage Intensity Presets" />
        {listItems.length === 0 ? (
          <Text style={{color: theme.colors.textPrimary, padding: spacing.md}}>
            No intensity presets saved yet.
          </Text>
        ) : (
          <ClickableList items={listItems} />
        )}
        <DividerWithLabel label="Or create" />
        <SelectableField
          label="Training Goal"
          value={
            trainingGoals.find(g => g.id === newPreset.trainingGoalId)?.name ||
            'Select Training Goal'
          }
          onPress={() =>
            onOpenTrainingGoalPicker({}, value => {
              setNewPreset(prev => ({
                ...prev,
                trainingGoalId: value,
              }));
            })
          }
        />
        <SelectableField
          label="Experience Level"
          value={newPreset.experienceLevel || 'Select Experience Level'}
          onPress={() =>
            onOpenExperienceLevelPicker({}, value => {
              setNewPreset(prev => ({
                ...prev,
                experienceLevel: value,
              }));
            })
          }
        />
        <FormInput
          label="Default Sets"
          value={String(newPreset.defaultSets)}
          keyboardType="numeric"
          onChangeText={v =>
            setNewPreset(p => ({...p, defaultSets: Number(v)}))
          }
        />
        <FormInput
          label="Default Reps"
          value={String(newPreset.defaultReps)}
          keyboardType="numeric"
          onChangeText={v =>
            setNewPreset(p => ({...p, defaultReps: Number(v)}))
          }
        />
        <FormInput
          label="Default Rest (sec)"
          value={String(newPreset.defaultRestSec)}
          keyboardType="numeric"
          onChangeText={v =>
            setNewPreset(p => ({...p, defaultRestSec: Number(v)}))
          }
        />
        <FormInput
          label="Default RPE"
          value={String(newPreset.defaultRpe)}
          keyboardType="numeric"
          onChangeText={v => setNewPreset(p => ({...p, defaultRpe: Number(v)}))}
        />
        <ButtonRow>
          <Button text="Close" fullWidth onPress={onClose} />
          <Button text="Create" fullWidth onPress={handleCreate} />
        </ButtonRow>
      </ScrollView>
    </View>
  );
}
