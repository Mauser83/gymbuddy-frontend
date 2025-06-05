import React, {useState} from 'react';
import {ScrollView, View, TouchableOpacity, Touchable} from 'react-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Card from 'shared/components/Card';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import ClickableList from 'shared/components/ClickableList';
import ButtonRow from 'shared/components/ButtonRow';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useTheme} from 'shared/theme/ThemeProvider';
import {useReferenceManagement} from 'modules/exercise/hooks/useReferenceManagement';
import DividerWithLabel from 'shared/components/DividerWithLabel';
import {CreateMetricInput} from 'modules/exercise/hooks/useReferenceManagement';
import {useReferenceData} from 'modules/exercise/hooks/useReferenceData';
import OptionItem from 'shared/components/OptionItem';
import ModalWrapper from 'shared/components/ModalWrapper';
import SelectableField from 'shared/components/SelectableField';
import {Metric} from 'modules/exercise/types/exercise.types';

export default function AdminExerciseCatalogScreen() {
  const {theme} = useTheme();
  const [mode, setMode] = useState<
    'type' | 'difficulty' | 'bodyPart' | 'muscle' | 'metric' | null
  >(null);
  const [selectedBodyPartId, setSelectedBodyPartId] = useState<number | null>(
    null,
  );
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newValue, setNewValue] = useState('');
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [newMetric, setNewMetric] = useState({
    name: '',
    slug: '',
    unit: '',
    inputType: 'number',
  });
  const [metricEdits, setMetricEdits] = useState<
    Record<number, CreateMetricInput>
  >({});
  const [showNewMetricPicker, setShowNewMetricPicker] = useState(false);

  const [newExerciseType, setNewExerciseType] = useState({
    name: '',
    metricIds: [] as number[],
  });

  const [exerciseTypeEdits, setExerciseTypeEdits] = useState<
    Record<number, {name: string; metricIds: number[]}>
  >({});

  const {metrics} = useReferenceData();
  const [visibleMetricPickerId, setVisibleMetricPickerId] = useState<
    number | null
  >(null);

  const currentMode =
    mode === 'muscle' && selectedBodyPartId === null ? 'bodyPart' : mode;
  const {data, refetch, createItem, updateItem, deleteItem} =
    useReferenceManagement(
      currentMode ?? 'metric',
      selectedBodyPartId || undefined,
    );

  function slugify(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  const items = (data || [])
    .slice()
    .sort((a: any, b: any) => {
      const aVal = 'name' in a ? a.name : 'level' in a ? a.level : '';
      const bVal = 'name' in b ? b.name : 'level' in b ? b.level : '';
      return aVal.localeCompare(bVal);
    })
    .map((item: any) => {
      const label =
        'name' in item ? item.name : 'level' in item ? item.level : '';
      return {
        id: item.id,
        label,
        selected: expandedId === item.id,
        rightElement:
          expandedId === item.id ? (
            <FontAwesome
              name="chevron-down"
              size={16}
              color={theme.colors.accentStart}
            />
          ) : null,
        onPress: () => {
          if (mode === 'muscle' && selectedBodyPartId === null) {
            setSelectedBodyPartId(item.id);
          } else {
            setExpandedId(prev => (prev === item.id ? null : item.id));

            if (mode === 'metric') {
              setMetricEdits(prev => ({
                ...prev,
                [item.id]: {
                  name: item.name,
                  slug: item.slug,
                  unit: item.unit,
                  inputType: item.inputType,
                },
              }));
            } else if (mode === 'type') {
              setExerciseTypeEdits(prev => ({
                ...prev,
                [item.id]: {
                  name: item.name,
                  metricIds: item.metrics?.map((m: Metric) => m.id) || [],
                },
              }));
            } else {
              setEdits(prev => ({
                ...prev,
                [item.id]: item.name || item.level || '',
              }));
            }
          }
        },
        content: expandedId === item.id && (
          <>
            {mode === 'metric' ? (
              <>
                <FormInput
                  label="Name"
                  value={metricEdits[item.id]?.name || ''}
                  onChangeText={val =>
                    setMetricEdits(prev => ({
                      ...prev,
                      [item.id]: {
                        ...(prev[item.id] || {}),
                        name: val,
                        slug: slugify(val),
                      },
                    }))
                  }
                />
                <FormInput
                  label="Unit"
                  value={metricEdits[item.id]?.unit || ''}
                  onChangeText={val =>
                    setMetricEdits(prev => ({
                      ...prev,
                      [item.id]: {
                        ...(prev[item.id] || {}),
                        unit: val,
                      },
                    }))
                  }
                />
                <FormInput
                  label="Input Type (number | time | text)"
                  value={metricEdits[item.id]?.inputType || ''}
                  onChangeText={val =>
                    setMetricEdits(prev => ({
                      ...prev,
                      [item.id]: {
                        ...(prev[item.id] || {}),
                        inputType: val,
                      },
                    }))
                  }
                />
              </>
            ) : mode === 'type' ? (
              <>
                <FormInput
                  label="Name"
                  value={exerciseTypeEdits[item.id]?.name || ''}
                  onChangeText={val =>
                    setExerciseTypeEdits(prev => ({
                      ...prev,
                      [item.id]: {
                        ...(prev[item.id] || {metricIds: []}),
                        name: val,
                      },
                    }))
                  }
                />
                <SelectableField
                  label="Metrics"
                  value={
                    exerciseTypeEdits[item.id]?.metricIds?.length
                      ? exerciseTypeEdits[item.id].metricIds
                          .map(
                            id =>
                              metrics.find(m => m.id === id)?.name || `#${id}`,
                          )
                          .join(', ')
                      : 'Select metrics'
                  }
                  onPress={() => setVisibleMetricPickerId(item.id)}
                />
              </>
            ) : (
              <FormInput
                label="Name"
                value={edits[item.id] || ''}
                onChangeText={val =>
                  setEdits(prev => ({...prev, [item.id]: val}))
                }
              />
            )}
            <ButtonRow>
              <Button
                text="Update"
                fullWidth
                onPress={() => handleUpdate(item.id)}
              />
              <Button
                text="Delete"
                fullWidth
                onPress={() => deleteItem(item.id).then(refetch)}
              />
            </ButtonRow>
            {visibleMetricPickerId === item.id && (
              <ModalWrapper
                visible={true}
                onClose={() => setVisibleMetricPickerId(null)}>
                <ScrollView>
                  {metrics.map(metric => {
                    const selected =
                      exerciseTypeEdits[item.id]?.metricIds?.includes(
                        metric.id,
                      ) || false;
                    return (
                      <OptionItem
                        key={metric.id}
                        text={metric.name}
                        selected={
                          exerciseTypeEdits[item.id]?.metricIds?.includes(
                            metric.id,
                          ) || false
                        }
                        onPress={() => {
                          setExerciseTypeEdits(prev => {
                            const current = prev[item.id]?.metricIds || [];
                            const updatedIds = selected
                              ? current.filter(id => id !== metric.id)
                              : [...current, metric.id];
                            return {
                              ...prev,
                              [item.id]: {
                                ...(prev[item.id] || {name: ''}),
                                metricIds: updatedIds,
                              },
                            };
                          });
                        }}
                      />
                    );
                  })}
                </ScrollView>
              </ModalWrapper>
            )}
          </>
        ),
      };
    });

  const handleCreate = async () => {
    if (mode === 'type') {
      await (
        createItem as (input: {
          name: string;
          metricIds: number[];
        }) => Promise<any>
      )(newExerciseType);
      setNewExerciseType({name: '', metricIds: []});
    } else if (mode === 'metric') {
      await (createItem as (input: CreateMetricInput) => Promise<any>)(
        newMetric,
      );
      setNewMetric({name: '', slug: '', unit: '', inputType: 'number'});
    } else {
      await (createItem as (input: string) => Promise<any>)(newValue);
      setNewValue('');
    }
    refetch();
  };

  const handleUpdate = async (id: number) => {
    if (mode === 'metric') {
      const updated = metricEdits[id];
      if (!updated) return;
      await (
        updateItem as (
          id: number,
          input: Partial<CreateMetricInput>,
        ) => Promise<any>
      )(id, updated);
    }
    if (mode === 'type') {
      const updated = exerciseTypeEdits[id];
      if (!updated) return;
      await (
        updateItem as (
          id: number,
          input: {name: string; metricIds: number[]},
        ) => Promise<any>
      )(id, updated);
    } else {
      const updated = edits[id];
      if (!updated || updated === '') return;
      await (updateItem as (id: number, input: string) => Promise<any>)(
        id,
        updated,
      );
    }
    refetch();
  };

  const catalogSections: {key: typeof mode; label: string, sublabel: string}[] = [
    {key: 'metric', label: 'Metrics', sublabel: 'Click to manage metrics'}, // New
    {key: 'type', label: 'Exercise Types', sublabel: 'Click to manage exercise types'},
    {key: 'difficulty', label: 'Difficulties', sublabel: 'Click to manage difficulties'},
    {key: 'bodyPart', label: 'Body Parts', sublabel: 'Click to manage body parts'},
    {key: 'muscle', label: 'Muscles', sublabel: 'Click to manage muscles'},
  ];

  return (
    <ScreenLayout scroll>
      <Title
        text="Manage Exercise Reference Data"
        subtitle="Admin-only control for metadata"
      />

      <ScrollView>
        {catalogSections.map(section => (
          <View key={section.key}>
            {mode === section.key ? (
              <Card>
                <TouchableOpacity onPress={() => setMode(null)}>
                  <Title text={section.label} />
                </TouchableOpacity>

                {mode === section.key && (
                  <>
                    {mode === 'metric' ? (
                      <>
                        <FormInput
                          label="Name"
                          value={newMetric.name}
                          onChangeText={val =>
                            setNewMetric(prev => ({
                              ...prev,
                              name: val,
                              slug: slugify(val),
                            }))
                          }
                        />
                        <FormInput
                          label="Unit"
                          value={newMetric.unit}
                          onChangeText={val =>
                            setNewMetric(prev => ({...prev, unit: val}))
                          }
                        />
                        <FormInput
                          label="Input Type (e.g. number, time, text)"
                          value={newMetric.inputType}
                          onChangeText={val =>
                            setNewMetric(prev => ({...prev, inputType: val}))
                          }
                        />
                      </>
                    ) : mode === 'type' ? (
                      <>
                        <FormInput
                          label="Name"
                          value={newExerciseType.name}
                          onChangeText={val =>
                            setNewExerciseType(prev => ({...prev, name: val}))
                          }
                        />
                        <SelectableField
                          label="Metrics"
                          value={
                            newExerciseType.metricIds
                              .map(
                                id =>
                                  metrics.find(m => m.id === id)?.name ||
                                  `#${id}`,
                              )
                              .join(', ') || 'Select metrics'
                          }
                          onPress={() => setShowNewMetricPicker(true)}
                        />
                      </>
                    ) : (
                      <FormInput
                        label={
                          section.key === 'difficulty'
                            ? 'New Difficulty'
                            : `New ${section.label.slice(0, -1)}`
                        }
                        value={newValue}
                        onChangeText={setNewValue}
                      />
                    )}

                    <ButtonRow>
                      <Button text="Create" fullWidth onPress={handleCreate} />
                    </ButtonRow>

                    <DividerWithLabel label={section.label} />
                    <ClickableList items={items} />

                    {showNewMetricPicker && (
                      <ModalWrapper
                        visible
                        onClose={() => setShowNewMetricPicker(false)}>
                        <ScrollView>
                          {metrics.map(metric => {
                            const selected = newExerciseType.metricIds.includes(
                              metric.id,
                            );
                            return (
                              <OptionItem
                                key={metric.id}
                                text={metric.name}
                                selected={newExerciseType.metricIds.includes(
                                  metric.id,
                                )}
                                onPress={() => {
                                  setNewExerciseType(prev => {
                                    const updated = selected
                                      ? prev.metricIds.filter(
                                          id => id !== metric.id,
                                        )
                                      : [...prev.metricIds, metric.id];
                                    return {...prev, metricIds: updated};
                                  });
                                }}
                              />
                            );
                          })}
                        </ScrollView>
                      </ModalWrapper>
                    )}
                  </>
                )}
                {mode !== section.key && (
                  <ClickableList
                    items={[
                      {
                        id: section.key ?? 'unknown',
                        label: `View and manage ${section.label.toLowerCase()}`,
                        onPress: () => {
                          setMode(section.key);
                          setExpandedId(null);
                          setNewValue('');
                          setSelectedBodyPartId(null);
                        },
                      },
                    ]}
                  />
                )}
              </Card>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setMode(section.key);
                  setExpandedId(null);
                  setNewValue('');
                  setSelectedBodyPartId(null);
                }}>
                <Card>
                  <Title text={section.label} subtitle={section.sublabel} />
                </Card>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </ScreenLayout>
  );
}
