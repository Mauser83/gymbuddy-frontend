import React, {useState} from 'react';
import {ScrollView, View, TouchableOpacity, Switch} from 'react-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Card from 'shared/components/Card';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import ClickableList from 'shared/components/ClickableList';
import ButtonRow from 'shared/components/ButtonRow';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useTheme} from 'shared/theme/ThemeProvider';
import {spacing} from 'shared/theme/tokens';
import DividerWithLabel from 'shared/components/DividerWithLabel';
import SelectableField from 'shared/components/SelectableField';
import DifficultyPickerModal from 'modules/workoutplan/components/DifficultyPickerModal';
import TrainingGoalPickerModal from 'modules/workoutplan/components/TrainingGoalPickerModal';
import EditMuscleGroupModal from 'modules/portals/appManagement/components/EditMuscleGroupModal';
import {
  CREATE_TRAINING_GOAL,
  UPDATE_TRAINING_GOAL,
  DELETE_TRAINING_GOAL,
  CREATE_INTENSITY_PRESET,
  UPDATE_INTENSITY_PRESET,
  DELETE_INTENSITY_PRESET,
  CREATE_MUSCLE_GROUP,
  UPDATE_MUSCLE_GROUP,
  DELETE_MUSCLE_GROUP,
  CREATE_TRAINING_METHOD,
  UPDATE_TRAINING_METHOD,
  DELETE_TRAINING_METHOD,
  UPDATE_TRAINING_METHOD_GOALS,
  CREATE_EXPERIENCE_LEVEL,
  UPDATE_EXPERIENCE_LEVEL,
  DELETE_EXPERIENCE_LEVEL,
} from 'modules/workoutplan/graphql/workoutReferences';
import {useQuery, useMutation} from '@apollo/client';
import {GET_WORKOUT_PLAN_META} from 'modules/workoutplan/graphql/workoutMeta.graphql';
import ModalWrapper from 'shared/components/ModalWrapper';
import OptionItem from 'shared/components/OptionItem';

const METRIC_IDS = {
  REPS: 1,
  RPE: 2,
  REST: 3,
  SETS: 4,
  TIME: 5,
  DISTANCE: 6,
};

interface MuscleGroup {
  id: number;
  name: string;
  bodyParts: {id: number; name: string}[];
}

interface TrainingMethod {
  id: number;
  name: string;
  slug: string;
  description?: string;
  trainingGoals?: {id: number; name: string}[]; // ← Add this
  minGroupSize?: number; // ✅ Add this
  maxGroupSize?: number; // ✅ Add this
  shouldAlternate?: boolean; // ✅ NEW
}

export interface IntensityMetricDefault {
  metricId: number;
  defaultMin: number;
  defaultMax?: number;
}
export interface IntensityPreset {
  id: number;
  trainingGoalId: number;
  experienceLevelId: number;
  experienceLevel: {id: number; name: string; key: string; isDefault: boolean};
  metricDefaults: IntensityMetricDefault[];
}

export interface IntensityPresetInput {
  trainingGoalId: number;
  experienceLevelId: number;
  metricDefaults: IntensityMetricDefault[];
}

interface ExperienceLevel {
  id: number;
  name: string;
  key: string;
  isDefault: boolean;
}

// State used for editing presets can include the associated experience level for
// display purposes. The GraphQL mutation input does not accept this field so it
// will be stripped out before submitting.
export interface IntensityPresetEdit extends IntensityPresetInput {
  experienceLevel?: ExperienceLevel;
}

export default function AdminWorkoutPlanCatalogScreen() {
  const {theme} = useTheme();
  const [mode, setMode] = useState<
    | 'trainingGoal'
    | 'experienceLevel'
    | 'preset'
    | 'muscleGroup'
    | 'trainingMethod'
    | null
  >(null);

  const {data, refetch} = useQuery(GET_WORKOUT_PLAN_META);

  const [newValue, setNewValue] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [newPreset, setNewPreset] = useState<IntensityPresetInput>({
    trainingGoalId: 0,
    experienceLevelId: 0,
    metricDefaults: [
      {metricId: METRIC_IDS.REPS, defaultMin: 10, defaultMax: undefined},
      {metricId: METRIC_IDS.RPE, defaultMin: 8, defaultMax: undefined},
      {metricId: METRIC_IDS.REST, defaultMin: 60, defaultMax: undefined},
      {metricId: METRIC_IDS.SETS, defaultMin: 3, defaultMax: undefined},
    ],
  });
  const [presetEdits, setPresetEdits] = useState<Record<number, IntensityPresetEdit>>({});
  const [expandedPresetId, setExpandedPresetId] = useState<number | null>(null);
  const [pickerState, setPickerState] = useState<
    'trainingGoal' | 'experienceLevel' | 'editMuscleGroup' | null
  >(null);
  const [editingPresetId, setEditingPresetId] = useState<number | null>(null);

  const [newGroupValue, setNewGroupValue] = useState('');
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);
  const [groupEdits, setGroupEdits] = useState<Record<number, string>>({});
  const [editMuscleGroupTarget, setEditMuscleGroupTarget] =
    useState<MuscleGroup | null>(null);
  const [newMethodValue, setNewMethodValue] = useState('');
  const [expandedMethodId, setExpandedMethodId] = useState<number | null>(null);
  const [methodEdits, setMethodEdits] = useState<
    Record<number, Partial<TrainingMethod>>
  >({});

  const [newLevel, setNewLevel] = useState({
    name: '',
    key: '',
    isDefault: false,
  });
  const [levelEdits, setLevelEdits] = useState<
    Record<number, Partial<ExperienceLevel>>
  >({});
  const [expandedLevelId, setExpandedLevelId] = useState<number | null>(null);

  const [createTrainingGoal] = useMutation(CREATE_TRAINING_GOAL);
  const [updateTrainingGoal] = useMutation(UPDATE_TRAINING_GOAL);
  const [deleteTrainingGoal] = useMutation(DELETE_TRAINING_GOAL);
  const [createPreset] = useMutation(CREATE_INTENSITY_PRESET);
  const [updatePreset] = useMutation(UPDATE_INTENSITY_PRESET);
  const [deletePreset] = useMutation(DELETE_INTENSITY_PRESET);
  const [createMuscleGroup] = useMutation(CREATE_MUSCLE_GROUP);
  const [updateMuscleGroup] = useMutation(UPDATE_MUSCLE_GROUP);
  const [deleteMuscleGroup] = useMutation(DELETE_MUSCLE_GROUP);
  const [createMethod] = useMutation(CREATE_TRAINING_METHOD);
  const [updateMethod] = useMutation(UPDATE_TRAINING_METHOD);
  const [deleteMethod] = useMutation(DELETE_TRAINING_METHOD);
  const [updateMethodGoals] = useMutation(UPDATE_TRAINING_METHOD_GOALS);
  const [createLevel] = useMutation(CREATE_EXPERIENCE_LEVEL);
  const [updateLevel] = useMutation(UPDATE_EXPERIENCE_LEVEL);
  const [deleteLevel] = useMutation(DELETE_EXPERIENCE_LEVEL);

  const trainingGoals = data?.getTrainingGoals || [];
  const presets = data?.getIntensityPresets || [];
  const muscleGroups = data?.getMuscleGroups || [];
  const trainingMethods = data?.getTrainingMethods || [];
  const experienceLevels = data?.experienceLevels || [];

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
          input: {name: value, slug: value.toLowerCase().replace(/\s+/g, '-')},
        },
      });
      setExpandedId(null);
      setEdits(prev => {
        const updated = {...prev};
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
      await deleteTrainingGoal({variables: {id}});
      await refetch();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleCreatePreset = async () => {
    try {
      await createPreset({variables: {input: newPreset}});
      setNewPreset({
        trainingGoalId: 0,
        experienceLevelId: 0,
        metricDefaults: [
          {metricId: METRIC_IDS.REPS, defaultMin: 10, defaultMax: undefined},
          {metricId: METRIC_IDS.RPE, defaultMin: 8, defaultMax: undefined},
          {metricId: METRIC_IDS.REST, defaultMin: 60, defaultMax: undefined},
          {metricId: METRIC_IDS.SETS, defaultMin: 3, defaultMax: undefined},
        ],
      });
      await refetch();
    } catch (err) {
      console.error('Create preset error:', err);
    }
  };

  const handleUpdatePreset = async (id: number) => {
    try {
      await updatePreset({variables: {id, input: presetEdits[id]}});
      setExpandedPresetId(null);
      setPresetEdits(prev => {
        const updated = {...prev};
        delete updated[id];
        return updated;
      });
      await refetch();
    } catch (err) {
      console.error('Update preset error:', err);
    }
  };

  const handleDeletePreset = async (id: number) => {
    try {
      await deletePreset({variables: {id}});
      await refetch();
    } catch (err) {
      console.error('Delete preset error:', err);
    }
  };

  const handleCreateGroup = async () => {
    try {
      await createMuscleGroup({
        variables: {
          input: {
            name: newGroupValue,
            slug: newGroupValue.toLowerCase().replace(/\s+/g, '-'),
            bodyPartIds: [],
          },
        },
      });
      setNewGroupValue('');
      await refetch();
    } catch (err) {
      console.error('Error creating muscle group:', err);
    }
  };

  const handleUpdateGroup = async (id: number) => {
    try {
      await updateMuscleGroup({
        variables: {
          id,
          input: {
            name: groupEdits[id],
            slug: groupEdits[id].toLowerCase().replace(/\s+/g, '-'),
            bodyPartIds: [],
          },
        },
      });
      setExpandedGroupId(null);
      setGroupEdits(prev => {
        const updated = {...prev};
        delete updated[id];
        return updated;
      });
      await refetch();
    } catch (err) {
      console.error('Error updating muscle group:', err);
    }
  };

  const handleDeleteGroup = async (id: number) => {
    try {
      await deleteMuscleGroup({variables: {id}});
      await refetch();
    } catch (err) {
      console.error('Error deleting muscle group:', err);
    }
  };

  const handleCreateLevel = async () => {
    try {
      await createLevel({variables: {input: newLevel}});
      setNewLevel({name: '', key: '', isDefault: false});
      await refetch();
    } catch (err) {
      console.error('Error creating level:', err);
    }
  };

  const handleUpdateLevel = async (id: number) => {
    try {
      await updateLevel({variables: {id, input: levelEdits[id]}});
      setExpandedLevelId(null);
      setLevelEdits(prev => {
        const updated = {...prev};
        delete updated[id];
        return updated;
      });
      await refetch();
    } catch (err) {
      console.error('Error updating level:', err);
    }
  };

  const handleDeleteLevel = async (id: number) => {
    try {
      await deleteLevel({variables: {id}});
      await refetch();
    } catch (err) {
      console.error('Error deleting level:', err);
    }
  };

  const handleSaveBodyParts = async (name: string, bodyPartIds: number[]) => {
    if (!editMuscleGroupTarget) return;
    try {
      await updateMuscleGroup({
        variables: {
          id: editMuscleGroupTarget.id,
          input: {
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-'),
            bodyPartIds,
          },
        },
      });
      await refetch();
      setEditMuscleGroupTarget(null);
      setPickerState(null);
    } catch (err) {
      console.error('Error saving muscle group:', err);
    }
  };

  const handleCreateMethod = async () => {
    if (!newMethodValue.trim()) return;
    await createMethod({
      variables: {
        input: {
          name: newMethodValue,
          slug: newMethodValue.toLowerCase().replace(/\s+/g, '-'),
        },
      },
    });
    setNewMethodValue('');
    await refetch();
  };

  const handleUpdateMethod = async (id: number) => {
    await updateMethod({
      variables: {
        id,
        input: {
          name: methodEdits[id]?.name || '',
          slug: (methodEdits[id]?.name || '')
            .toLowerCase()
            .replace(/\s+/g, '-'),
          minGroupSize:
            methodEdits[id]?.minGroupSize === undefined
              ? null
              : methodEdits[id]?.minGroupSize,
          maxGroupSize:
            methodEdits[id]?.maxGroupSize === undefined
              ? null
              : methodEdits[id]?.maxGroupSize,
          shouldAlternate: methodEdits[id]?.shouldAlternate ?? false,
        },
      },
    });
    setExpandedMethodId(null);
    setMethodEdits(prev => {
      const updated = {...prev};
      delete updated[id];
      return updated;
    });
    await refetch();
  };

  const handleDeleteMethod = async (id: number) => {
    await deleteMethod({variables: {id}});
    await refetch();
  };

  const catalogSections: {key: typeof mode; label: string; sublabel: string}[] =
    [
      {
        key: 'trainingGoal',
        label: 'Training Goals',
        sublabel: 'Click to manage training goals',
      },
      {
        key: 'experienceLevel',
        label: 'Experience Levels',
        sublabel: 'Click to manage experience levels',
      },
      {
        key: 'preset',
        label: 'Intensity Presets',
        sublabel: 'Click to manage intensity presets',
      },
      {
        key: 'muscleGroup',
        label: 'Muscle Groups',
        sublabel: 'Click to manage muscle groups',
      },
      {
        key: 'trainingMethod',
        label: 'Training Methods',
        sublabel: 'Click to manage training methods',
      },
    ];

  return (
    <ScreenLayout scroll>
      <Title
        text="Manage Workout Plan Catalog"
        subtitle="Admin-only control for workout metadata"
      />
      <View>
        {mode === 'trainingGoal' ? (
          <Card>
            <TouchableOpacity onPress={() => setMode(null)}>
              <Title text="Training Goals" />
            </TouchableOpacity>
            <FormInput
              label="New Training Goal"
              value={newValue}
              onChangeText={setNewValue}
            />
            <ButtonRow>
              <Button text="Create" fullWidth onPress={handleCreate} />
            </ButtonRow>
            <ClickableList
              items={trainingGoals.map((goal: {id: number; name: string}) => {
                const isExpanded = expandedId === goal.id;
                const currentEditValue = edits[goal.id] ?? goal.name;

                return {
                  id: goal.id,
                  label: goal.name,
                  selected: isExpanded,
                  rightElement: isExpanded ? (
                    <FontAwesome
                      name="chevron-down"
                      size={16}
                      color={theme.colors.accentStart}
                    />
                  ) : null,
                  onPress: () => {
                    setExpandedId(prev => (prev === goal.id ? null : goal.id));
                    setEdits(prev => ({...prev, [goal.id]: goal.name}));
                  },
                  content: isExpanded ? (
                    <View style={{gap: spacing.sm}}>
                      <FormInput
                        label="Edit Name"
                        value={currentEditValue}
                        onChangeText={text =>
                          setEdits(prev => ({...prev, [goal.id]: text}))
                        }
                      />
                      <ButtonRow>
                        <Button
                          text="Update"
                          fullWidth
                          onPress={() =>
                            handleUpdate(goal.id, currentEditValue)
                          }
                          disabled={
                            currentEditValue.trim() === '' ||
                            currentEditValue === goal.name
                          }
                        />
                        <Button
                          text="Delete"
                          fullWidth
                          onPress={() => handleDelete(goal.id)}
                        />
                      </ButtonRow>
                    </View>
                  ) : undefined,
                };
              })}
            />
          </Card>
        ) : (
          <TouchableOpacity onPress={() => setMode('trainingGoal')}>
            <Card>
              <Title
                text="Training Goals"
                subtitle="Click to manage training goals"
              />
            </Card>
          </TouchableOpacity>
        )}
      </View>
      
      <View>
        {mode === 'experienceLevel' ? (
          <Card>
            <View>
              {mode === 'experienceLevel' ? (
                <Card>
                  <TouchableOpacity onPress={() => setMode(null)}>
                    <Title text="Experience Levels" />
                  </TouchableOpacity>
                  <FormInput
                    label="Name"
                    value={newLevel.name}
                    onChangeText={text =>
                      setNewLevel(p => ({...p, name: text}))
                    }
                  />
                  <FormInput
                    label="Key"
                    value={newLevel.key}
                    onChangeText={text => setNewLevel(p => ({...p, key: text}))}
                  />
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Title subtitle="Default" />
                    <Switch
                      value={newLevel.isDefault}
                      onValueChange={val =>
                        setNewLevel(p => ({...p, isDefault: val}))
                      }
                      trackColor={{
                        true: theme.colors.accentStart,
                        false: 'grey',
                      }}
                      thumbColor={theme.colors.accentEnd}
                    />
                  </View>
                  <ButtonRow>
                    <Button
                      text="Create"
                      fullWidth
                      onPress={handleCreateLevel}
                    />
                  </ButtonRow>
                  <ClickableList
                    items={experienceLevels.map((level: ExperienceLevel) => {
                      const isExpanded = expandedLevelId === level.id;
                      const edit = levelEdits[level.id] || level;
                      return {
                        id: level.id,
                        label: level.name,
                        selected: isExpanded,
                        onPress: () => {
                          setExpandedLevelId(prev =>
                            prev === level.id ? null : level.id,
                          );
                          setLevelEdits(prev => ({...prev, [level.id]: level}));
                        },
                        content: isExpanded ? (
                          <View style={{gap: spacing.sm}}>
                            <FormInput
                              label="Name"
                              value={edit.name ?? ''}
                              onChangeText={text =>
                                setLevelEdits(p => ({
                                  ...p,
                                  [level.id]: {...edit, name: text},
                                }))
                              }
                            />
                            <FormInput
                              label="Key"
                              value={edit.key ?? ''}
                              onChangeText={text =>
                                setLevelEdits(p => ({
                                  ...p,
                                  [level.id]: {...edit, key: text},
                                }))
                              }
                            />
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                              }}>
                              <Title subtitle="Default" />
                              <Switch
                                value={!!edit.isDefault}
                                trackColor={{
                                  true: theme.colors.accentStart,
                                  false: 'grey',
                                }}
                                thumbColor={theme.colors.accentEnd}
                                onValueChange={val =>
                                  setLevelEdits(p => ({
                                    ...p,
                                    [level.id]: {...edit, isDefault: val},
                                  }))
                                }
                              />
                            </View>
                            <ButtonRow>
                              <Button
                                text="Update"
                                fullWidth
                                onPress={() => handleUpdateLevel(level.id)}
                              />
                              <Button
                                text="Delete"
                                fullWidth
                                onPress={() => handleDeleteLevel(level.id)}
                              />
                            </ButtonRow>
                          </View>
                        ) : undefined,
                      };
                    })}
                  />
                </Card>
              ) : (
                <TouchableOpacity onPress={() => setMode('experienceLevel')}>
                  <Card>
                    <Title
                      text="Experience Levels"
                      subtitle="Click to manage experience levels"
                    />
                  </Card>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ) : (
          <TouchableOpacity onPress={() => setMode('experienceLevel')}>
            <Card>
              <Title
                text="Experience Levels"
                subtitle="Click to manage experience levels"
              />
            </Card>
          </TouchableOpacity>
        )}
      </View>

      <View>
        {mode === 'preset' ? (
          <Card>
            <TouchableOpacity onPress={() => setMode(null)}>
              <Title text="Intensity Presets" />
            </TouchableOpacity>
            <ClickableList
              items={presets.map(
                (preset: {
                  id: number;
                  trainingGoalId: number;
                  experienceLevelId: number;
                  experienceLevel: {id: number; name: string; key: string};
                  metricDefaults: IntensityMetricDefault[];
                }) => {
                  const isExpanded = expandedPresetId === preset.id;
                  const edit = presetEdits[preset.id] || preset;
                  const goal = trainingGoals.find(
                    (g: {id: number}) => g.id === edit.trainingGoalId,
                  );

                  return {
                    id: preset.id,
                    label: `${goal?.name || 'Goal'} – ${edit.experienceLevel?.name || ''}`,
                    selected: isExpanded,
                    rightElement: isExpanded ? (
                      <FontAwesome
                        name="chevron-down"
                        size={16}
                        color={theme.colors.accentStart}
                      />
                    ) : null,
                    onPress: () => {
                      setExpandedPresetId(prev =>
                        prev === preset.id ? null : preset.id,
                      );
                      setPresetEdits(prev => ({...prev, [preset.id]: preset}));
                    },
                    content: isExpanded ? (
                      <View style={{gap: spacing.sm}}>
                        <SelectableField
                          label="Training Goal"
                          value={goal?.name || 'Select Training Goal'}
                          onPress={() => {
                            setEditingPresetId(preset.id);
                            setPickerState('trainingGoal');
                          }}
                        />
                        <SelectableField
                          label="Experience Level"
                          value={
                            edit.experienceLevel?.name ||
                            'Select Experience Level'
                          }
                          onPress={() => {
                            setEditingPresetId(preset.id);
                            setPickerState('experienceLevel');
                          }}
                        />
                        {edit.metricDefaults.map((m: IntensityMetricDefault, idx: number) => (
                          <View
                            key={m.metricId}
                            style={{flexDirection: 'row', gap: spacing.sm}}>
                            <FormInput
                              label={`Metric ID ${m.metricId}`}
                              value={String(m.defaultMin)}
                              keyboardType="numeric"
                              onChangeText={v =>
                                setPresetEdits(p => ({
                                  ...p,
                                  [preset.id]: {
                                    ...edit,
                                    metricDefaults: edit.metricDefaults.map(
                                      (md: IntensityMetricDefault, i: number) =>
                                        i === idx
                                          ? {...md, defaultMin: Number(v)}
                                          : md,
                                    ),
                                  },
                                }))
                              }
                            />
                            <FormInput
                              label="Max (optional)"
                              value={String(m.defaultMax ?? '')}
                              keyboardType="numeric"
                              onChangeText={v =>
                                setPresetEdits(p => ({
                                  ...p,
                                  [preset.id]: {
                                    ...edit,
                                    metricDefaults: edit.metricDefaults.map(
                                      (md: IntensityMetricDefault, i: number) =>
                                        i === idx
                                          ? {
                                              ...md,
                                              defaultMax:
                                                v !== ''
                                                  ? Number(v)
                                                  : undefined,
                                            }
                                          : md,
                                    ),
                                  },
                                }))
                              }
                            />
                          </View>
                        ))}
                        <ButtonRow>
                          <Button
                            text="Update"
                            fullWidth
                            onPress={() => handleUpdatePreset(preset.id)}
                          />
                          <Button
                            text="Delete"
                            fullWidth
                            onPress={() => handleDeletePreset(preset.id)}
                          />
                        </ButtonRow>
                      </View>
                    ) : undefined,
                  };
                },
              )}
            />
            <DividerWithLabel label="Create New" />
            <SelectableField
              label="Training Goal"
              value={
                trainingGoals.find(
                  (g: {id: number}) => g.id === newPreset.trainingGoalId,
                )?.name || 'Select Training Goal'
              }
              onPress={() => {
                setEditingPresetId(null);
                setPickerState('trainingGoal');
              }}
            />
            <SelectableField
              label="Experience Level"
              value={
                data?.experienceLevels?.find(
                  (l: ExperienceLevel) => l.id === newPreset.experienceLevelId,
                )?.name || 'Select Experience Level'
              }
              onPress={() => {
                setEditingPresetId(null);
                setPickerState('experienceLevel');
              }}
            />
            {newPreset.metricDefaults.map((m, idx) => (
              <View
                key={m.metricId}
                style={{flexDirection: 'row', gap: spacing.sm}}>
                <FormInput
                  label={`Metric ID ${m.metricId}`}
                  value={String(m.defaultMin)}
                  keyboardType="numeric"
                  onChangeText={v =>
                    setNewPreset(p => ({
                      ...p,
                      metricDefaults: p.metricDefaults.map((md, i) =>
                        i === idx ? {...md, defaultMin: Number(v)} : md,
                      ),
                    }))
                  }
                />
                <FormInput
                  label="Max (optional)"
                  value={String(m.defaultMax ?? '')}
                  keyboardType="numeric"
                  onChangeText={v =>
                    setNewPreset(p => ({
                      ...p,
                      metricDefaults: p.metricDefaults.map((md: IntensityMetricDefault, i: number) =>
                        i === idx
                          ? {
                              ...md,
                              defaultMax: v !== '' ? Number(v) : undefined,
                            }
                          : md,
                      ),
                    }))
                  }
                />
              </View>
            ))}
            <ButtonRow>
              <Button text="Create" fullWidth onPress={handleCreatePreset} />
            </ButtonRow>
          </Card>
        ) : (
          <TouchableOpacity onPress={() => setMode('preset')}>
            <Card>
              <Title
                text="Intensity Presets"
                subtitle="Click to manage intensity presets"
              />
            </Card>
          </TouchableOpacity>
        )}
      </View>

      <View>
        {mode === 'muscleGroup' ? (
          <Card>
            <TouchableOpacity onPress={() => setMode(null)}>
              <Title text="Muscle Groups" />
            </TouchableOpacity>
            <FormInput
              label="New Muscle Group"
              value={newGroupValue}
              onChangeText={setNewGroupValue}
            />
            <ButtonRow>
              <Button text="Create" fullWidth onPress={handleCreateGroup} />
            </ButtonRow>
            <Title subtitle="Long press to edit body parts" />
            <ClickableList
              items={muscleGroups.map((group: MuscleGroup) => {
                const isExpanded = expandedGroupId === group.id;
                return {
                  id: group.id,
                  label: group.name,
                  selected: isExpanded,
                  onPress: () => {
                    setExpandedGroupId(prev =>
                      prev === group.id ? null : group.id,
                    );
                    setGroupEdits(prev => ({...prev, [group.id]: group.name}));
                  },
                  onLongPress: () => {
                    setEditMuscleGroupTarget({
                      id: group.id,
                      name: group.name,
                      bodyParts: group.bodyParts ?? [],
                    });
                    setPickerState('editMuscleGroup');
                  },
                  content: isExpanded ? (
                    <>
                      <FormInput
                        label="Edit Name"
                        value={groupEdits[group.id] || ''}
                        onChangeText={text =>
                          setGroupEdits(prev => ({...prev, [group.id]: text}))
                        }
                      />
                      <ButtonRow>
                        <Button
                          text="Update"
                          fullWidth
                          onPress={() => handleUpdateGroup(group.id)}
                          disabled={
                            !groupEdits[group.id] ||
                            groupEdits[group.id] === group.name
                          }
                        />
                        <Button
                          text="Delete"
                          fullWidth
                          onPress={() => handleDeleteGroup(group.id)}
                        />
                      </ButtonRow>
                    </>
                  ) : undefined,
                };
              })}
            />
          </Card>
        ) : (
          <TouchableOpacity onPress={() => setMode('muscleGroup')}>
            <Card>
              <Title
                text="Muscle Groups"
                subtitle="Click to manage muscle groups"
              />
            </Card>
          </TouchableOpacity>
        )}
      </View>

      <View>
        {mode === 'trainingMethod' ? (
          <Card>
            <TouchableOpacity onPress={() => setMode(null)}>
              <Title text="Training Methods" />
            </TouchableOpacity>
            <FormInput
              label="New Method Name"
              value={newMethodValue}
              onChangeText={setNewMethodValue}
            />
            <ButtonRow>
              <Button text="Create" fullWidth onPress={handleCreateMethod} />
            </ButtonRow>
            <ScrollView>
              <ClickableList
                items={trainingMethods.map((method: TrainingMethod) => {
                  const isExpanded = expandedMethodId === method.id;
                  return {
                    id: method.id,
                    label: method.name,
                    selected: isExpanded,
                    onPress: () => {
                      setExpandedMethodId(prev =>
                        prev === method.id ? null : method.id,
                      );
                      setMethodEdits(prev => ({
                        ...prev,
                        [method.id]: {
                          name: method.name,
                          minGroupSize: method.minGroupSize ?? undefined,
                          maxGroupSize: method.maxGroupSize ?? undefined,
                          shouldAlternate: method.shouldAlternate ?? false,
                        },
                      }));
                    },
                    content: isExpanded ? (
                      <View style={{gap: spacing.sm}}>
                        <FormInput
                          label="Edit Name"
                          value={methodEdits[method.id]?.name ?? method.name}
                          onChangeText={text =>
                            setMethodEdits(prev => ({
                              ...prev,
                              [method.id]: {
                                ...prev[method.id],
                                name: text,
                              },
                            }))
                          }
                        />
                        <View style={{flexDirection: 'row', gap: 12}}>
                          <View style={{flex: 1}}>
                            <FormInput
                              label="Min Group Size"
                              keyboardType="numeric"
                              value={String(
                                methodEdits[method.id]?.minGroupSize ?? '',
                              )}
                              onChangeText={v =>
                                setMethodEdits(prev => ({
                                  ...prev,
                                  [method.id]: {
                                    ...prev[method.id],
                                    minGroupSize:
                                      v === '' ? undefined : Number(v),
                                  },
                                }))
                              }
                            />
                          </View>
                          <View style={{flex: 1}}>
                            <FormInput
                              label="Max Group Size"
                              keyboardType="numeric"
                              value={String(
                                methodEdits[method.id]?.maxGroupSize ?? '',
                              )}
                              onChangeText={v =>
                                setMethodEdits(prev => ({
                                  ...prev,
                                  [method.id]: {
                                    ...prev[method.id],
                                    maxGroupSize:
                                      v === '' ? undefined : Number(v),
                                  },
                                }))
                              }
                            />
                          </View>
                        </View>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}>
                          <Title subtitle="Alternate Exercises in Group" />
                          <Switch
                            value={!!methodEdits[method.id]?.shouldAlternate}
                            trackColor={{
                              true: theme.colors.accentStart,
                              false: 'grey',
                            }}
                            thumbColor={theme.colors.accentEnd}
                            onValueChange={value =>
                              setMethodEdits(prev => ({
                                ...prev,
                                [method.id]: {
                                  ...prev[method.id],
                                  shouldAlternate: value,
                                },
                              }))
                            }
                          />
                        </View>
                        <Title
                          text="Linked Training Goals"
                          subtitle="Tap to toggle"
                        />
                        {trainingGoals.map(
                          (goal: {id: number; name: string}) => {
                            const isLinked = method.trainingGoals?.some(
                              (g: {id: number}) => g.id === goal.id,
                            );
                            return (
                              <OptionItem
                                key={goal.id}
                                text={goal.name}
                                selected={isLinked}
                                onPress={() => {
                                  const current =
                                    method.trainingGoals?.map(g => g.id) || [];
                                  const next = isLinked
                                    ? current.filter(id => id !== goal.id)
                                    : [...current, goal.id];

                                  updateMethodGoals({
                                    variables: {
                                      input: {
                                        methodId: method.id,
                                        goalIds: next,
                                      },
                                    },
                                  })
                                    .then(() => refetch())
                                    .catch(err =>
                                      console.error(
                                        'Failed to update training method goals',
                                        err,
                                      ),
                                    );
                                }}
                              />
                            );
                          },
                        )}

                        <ButtonRow>
                          <Button
                            text="Update"
                            fullWidth
                            onPress={() => handleUpdateMethod(method.id)}
                          />
                          <Button
                            text="Delete"
                            fullWidth
                            onPress={() => handleDeleteMethod(method.id)}
                          />
                        </ButtonRow>
                      </View>
                    ) : undefined,
                  };
                })}
              />
            </ScrollView>
          </Card>
        ) : (
          <TouchableOpacity onPress={() => setMode('trainingMethod')}>
            <Card>
              <Title
                text="Training Methods"
                subtitle="Click to manage training methods"
              />
            </Card>
          </TouchableOpacity>
        )}
      </View>

      <ModalWrapper
        visible={!!pickerState}
        onClose={() => setPickerState(null)}>
        {pickerState === 'trainingGoal' && (
          <TrainingGoalPickerModal
            visible
            trainingGoals={trainingGoals}
            selectedId={
              editingPresetId === null
                ? newPreset.trainingGoalId
                : presetEdits[editingPresetId]?.trainingGoalId
            }
            onSelect={id => {
              if (editingPresetId !== null) {
                setPresetEdits(prev => ({
                  ...prev,
                  [editingPresetId]: {
                    ...prev[editingPresetId],
                    trainingGoalId: id,
                  },
                }));
              } else {
                setNewPreset(prev => ({...prev, trainingGoalId: id}));
              }
              setPickerState(null);
            }}
            onClose={() => setPickerState(null)}
          />
        )}

        {pickerState === 'experienceLevel' && (
          <DifficultyPickerModal
            visible
            selectedId={
              editingPresetId === null
                ? newPreset.experienceLevelId || null
                : (presetEdits[editingPresetId]?.experienceLevelId ?? null)
            }
            levels={data?.experienceLevels ?? []}
            onSelect={levelId => {
              if (editingPresetId !== null) {
                setPresetEdits(prev => ({
                  ...prev,
                  [editingPresetId]: {
                    ...prev[editingPresetId],
                    experienceLevelId: levelId,
                    experienceLevel:
                      data?.experienceLevels.find(
                        (l: ExperienceLevel) => l.id === levelId,
                      ) ?? prev[editingPresetId].experienceLevel,
                  },
                }));
              } else {
                setNewPreset(prev => ({...prev, experienceLevelId: levelId}));
              }
              setPickerState(null);
            }}
            onClose={() => setPickerState(null)}
          />
        )}

        {pickerState === 'editMuscleGroup' && editMuscleGroupTarget && (
          <EditMuscleGroupModal
            visible
            muscleGroup={editMuscleGroupTarget}
            bodyPartOptions={data?.allBodyParts ?? []}
            onClose={() => setPickerState(null)}
            onSave={handleSaveBodyParts}
          />
        )}
      </ModalWrapper>
    </ScreenLayout>
  );
}
