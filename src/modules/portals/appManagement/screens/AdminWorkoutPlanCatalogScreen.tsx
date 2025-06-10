import React, {useState} from 'react';
import {ScrollView, View, TouchableOpacity} from 'react-native';
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
} from 'modules/workoutplan/graphql/workoutReferences';
import {useQuery, useMutation} from '@apollo/client';
import {GET_WORKOUT_PLAN_META} from 'modules/workoutplan/graphql/workoutMeta.graphql';
import ModalWrapper from 'shared/components/ModalWrapper';
import OptionItem from 'shared/components/OptionItem';

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
}

export interface IntensityPreset {
  id: number;
  trainingGoalId: number;
  experienceLevel: string;
  defaultSets: number;
  defaultReps: number;
  defaultRestSec: number;
  defaultRpe: number;
}

export default function AdminWorkoutPlanCatalogScreen() {
  const {theme} = useTheme();
  const [mode, setMode] = useState<
    'trainingGoal' | 'preset' | 'muscleGroup' | 'trainingMethod' | null
  >(null);

  const {data, refetch} = useQuery(GET_WORKOUT_PLAN_META);

  const [newValue, setNewValue] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [newPreset, setNewPreset] = useState({
    trainingGoalId: 0,
    experienceLevel: '',
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 60,
    defaultRpe: 8,
  });
  const [presetEdits, setPresetEdits] = useState<Record<number, any>>({});
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
  const [methodEdits, setMethodEdits] = useState<Record<number, string>>({});

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

  const trainingGoals = data?.getTrainingGoals || [];
  const presets = data?.getIntensityPresets || [];
  const muscleGroups = data?.getMuscleGroups || [];
  const trainingMethods = data?.getTrainingMethods || [];

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
        experienceLevel: '',
        defaultSets: 3,
        defaultReps: 10,
        defaultRestSec: 60,
        defaultRpe: 8,
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
          name: methodEdits[id],
          slug: methodEdits[id].toLowerCase().replace(/\s+/g, '-'),
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
                  experienceLevel: string;
                  defaultSets: number;
                  defaultReps: number;
                  defaultRestSec: number;
                  defaultRpe: number;
                }) => {
                  const isExpanded = expandedPresetId === preset.id;
                  const edit = presetEdits[preset.id] || preset;
                  const goal = trainingGoals.find(
                    (g: {id: number}) => g.id === edit.trainingGoalId,
                  );

                  return {
                    id: preset.id,
                    label: `${goal?.name || 'Goal'} – ${edit.experienceLevel}`,
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
                            edit.experienceLevel || 'Select Experience Level'
                          }
                          onPress={() => {
                            setEditingPresetId(preset.id);
                            setPickerState('experienceLevel');
                          }}
                        />
                        <FormInput
                          label="Sets"
                          value={String(edit.defaultSets)}
                          keyboardType="numeric"
                          onChangeText={v =>
                            setPresetEdits(p => ({
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
                            setPresetEdits(p => ({
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
                            setPresetEdits(p => ({
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
                            setPresetEdits(p => ({
                              ...p,
                              [preset.id]: {...edit, defaultRpe: Number(v)},
                            }))
                          }
                        />
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
              value={newPreset.experienceLevel || 'Select Experience Level'}
              onPress={() => {
                setEditingPresetId(null);
                setPickerState('experienceLevel');
              }}
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
              onChangeText={v =>
                setNewPreset(p => ({...p, defaultRpe: Number(v)}))
              }
            />
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
                  const currentEdit = methodEdits[method.id] ?? method.name;
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
                        [method.id]: method.name,
                      }));
                    },
                    content: isExpanded ? (
                      <View style={{gap: spacing.sm}}>
                        <FormInput
                          label="Edit Name"
                          value={currentEdit}
                          onChangeText={text =>
                            setMethodEdits(prev => ({
                              ...prev,
                              [method.id]: text,
                            }))
                          }
                        />

                        {/* NEW: Checkboxes for selecting training goals */}
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
            selectedLevel={
              editingPresetId === null
                ? newPreset.experienceLevel
                : presetEdits[editingPresetId]?.experienceLevel || 'BEGINNER'
            }
            onSelect={level => {
              if (editingPresetId !== null) {
                setPresetEdits(prev => ({
                  ...prev,
                  [editingPresetId]: {
                    ...prev[editingPresetId],
                    experienceLevel: level,
                  },
                }));
              } else {
                setNewPreset(prev => ({...prev, experienceLevel: level}));
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
