import FontAwesome from '@expo/vector-icons/FontAwesome5';
import React, { useState } from 'react';
import { ScrollView, View, TouchableOpacity, Text } from 'react-native';

import { useReferenceData } from 'features/exercises/hooks/useReferenceData';
import {
  useReferenceManagement,
  CreateMetricInput,
  OrderedMetric,
} from 'features/exercises/hooks/useReferenceManagement';
import Button from 'shared/components/Button';
import ButtonRow from 'shared/components/ButtonRow';
import Card from 'shared/components/Card';
import ClickableList from 'shared/components/ClickableList';
import DividerWithLabel from 'shared/components/DividerWithLabel';
import FormInput from 'shared/components/FormInput';
import IconButton from 'shared/components/IconButton';
import ModalWrapper from 'shared/components/ModalWrapper';
import NoResults from 'shared/components/NoResults';
import OptionItem from 'shared/components/OptionItem';
import ScreenLayout from 'shared/components/ScreenLayout';
import SelectableField from 'shared/components/SelectableField';
import Title from 'shared/components/Title';
import { useTheme } from 'shared/theme/ThemeProvider';
import { spacing } from 'shared/theme/tokens';

export default function AdminExerciseCatalogScreen() {
  const { theme } = useTheme();
  const [mode, setMode] = useState<'type' | 'difficulty' | 'bodyPart' | 'muscle' | null>(null);
  const [selectedBodyPartId, setSelectedBodyPartId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [newValue, setNewValue] = useState('');
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [showNewMetricPicker, setShowNewMetricPicker] = useState(false);

  const [newExerciseType, setNewExerciseType] = useState({
    name: '',
    metrics: [] as OrderedMetric[],
  });

  const reorderMetrics = (metrics: OrderedMetric[]): OrderedMetric[] =>
    metrics.map((m, i) => ({ ...m, order: i + 1 }));

  const moveMetric = (
    metrics: OrderedMetric[],
    index: number,
    direction: 'up' | 'down',
  ): OrderedMetric[] => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= metrics.length) return metrics;
    const updated = [...metrics];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    return reorderMetrics(updated);
  };

  const [exerciseTypeEdits, setExerciseTypeEdits] = useState<
    Record<number, { name: string; metrics: OrderedMetric[] }>
  >({});

  const { metrics } = useReferenceData();
  const [visibleMetricPickerId, setVisibleMetricPickerId] = useState<number | null>(null);

  const currentMode = mode === 'muscle' && selectedBodyPartId === null ? 'bodyPart' : mode;
  const { data, refetch, createItem, updateItem, deleteItem } = useReferenceManagement(
    currentMode ?? 'type',
    selectedBodyPartId || undefined,
  );

  const items = (data || [])
    .slice()
    .sort((a: any, b: any) => {
      const aVal = 'name' in a ? a.name : 'level' in a ? a.level : '';
      const bVal = 'name' in b ? b.name : 'level' in b ? b.level : '';
      return aVal.localeCompare(bVal);
    })
    .map((item: any) => {
      const label = 'name' in item ? item.name : 'level' in item ? item.level : '';
      return {
        id: item.id,
        label,
        selected: expandedId === item.id,
        rightElement:
          expandedId === item.id ? (
            <FontAwesome name="chevron-down" size={16} color={theme.colors.accentStart} />
          ) : null,
        onPress: () => {
          if (mode === 'muscle' && selectedBodyPartId === null) {
            setSelectedBodyPartId(item.id);
          } else {
            setExpandedId((prev) => (prev === item.id ? null : item.id));

            if (mode === 'type') {
              setExerciseTypeEdits((prev) => ({
                ...prev,
                [item.id]: {
                  name: item.name,
                  metrics:
                    item.orderedMetrics?.map((om: any) => ({
                      metricId: om.metric.id,
                      order: om.order,
                    })) || [],
                },
              }));
            } else {
              setEdits((prev) => ({
                ...prev,
                [item.id]: item.name || item.level || '',
              }));
            }
          }
        },
        content: expandedId === item.id && (
          <>
            {mode === 'type' ? (
              <>
                <FormInput
                  label="Name"
                  value={exerciseTypeEdits[item.id]?.name || ''}
                  onChangeText={(val) =>
                    setExerciseTypeEdits((prev) => ({
                      ...prev,
                      [item.id]: {
                        ...(prev[item.id] || { metricIds: [] }),
                        name: val,
                      },
                    }))
                  }
                />
                <SelectableField
                  label="Metrics"
                  value={
                    exerciseTypeEdits[item.id]?.metrics?.length
                      ? exerciseTypeEdits[item.id].metrics
                          .sort((a, b) => a.order - b.order)
                          .map(
                            (m) =>
                              metrics.find((metric) => metric.id === m.metricId)?.name ??
                              `#${m.metricId}`,
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
                onChangeText={(val) => setEdits((prev) => ({ ...prev, [item.id]: val }))}
              />
            )}
            <ButtonRow>
              <Button text="Update" fullWidth onPress={() => handleUpdate(item.id)} />
              <Button
                text="Delete"
                fullWidth
                onPress={async () => {
                  await deleteItem(item.id);
                  await refetch();
                }}
              />
            </ButtonRow>
            {visibleMetricPickerId === item.id && (
              <ModalWrapper visible onClose={() => setVisibleMetricPickerId(null)}>
                <ScrollView>
                  <Title text="Select Metrics" />
                  {metrics.filter(
                    (metric) =>
                      !exerciseTypeEdits[item.id]?.metrics?.some((m) => m.metricId === metric.id),
                  ).length === 0 ? (
                    <View style={{ paddingBottom: 8 }}>
                      <NoResults message="All available metrics have been selected." />
                    </View>
                  ) : (
                    metrics
                      .filter(
                        (metric) =>
                          !exerciseTypeEdits[item.id]?.metrics?.some(
                            (m) => m.metricId === metric.id,
                          ),
                      )
                      .map((metric) => (
                        <OptionItem
                          key={metric.id}
                          text={metric.name}
                          selected={false}
                          onPress={() => {
                            setExerciseTypeEdits((prev) => {
                              const current = prev[item.id]?.metrics || [];
                              return {
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  metrics: reorderMetrics([
                                    ...current,
                                    {
                                      metricId: metric.id,
                                      order: current.length + 1,
                                    },
                                  ]),
                                },
                              };
                            });
                          }}
                        />
                      ))
                  )}

                  <Button text="Confirm" fullWidth onPress={() => setVisibleMetricPickerId(null)} />

                  <DividerWithLabel label="Order selected metrics" />

                  {exerciseTypeEdits[item.id]?.metrics?.length === 0 ? (
                    <NoResults message="No metrics selected yet." />
                  ) : (
                    exerciseTypeEdits[item.id]?.metrics
                      .sort((a, b) => a.order - b.order)
                      .map((m, idx) => {
                        const metric = metrics.find((x) => x.id === m.metricId);
                        return (
                          <View
                            key={m.metricId}
                            style={{
                              padding: spacing.sm,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: theme.colors.accentStart,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <View style={{ flexDirection: 'column' }}>
                              <Text style={{ color: theme.colors.textPrimary }}>
                                #{idx + 1} {metric?.name}
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                              <IconButton
                                icon={
                                  <FontAwesome
                                    name="arrow-alt-circle-up"
                                    size={32}
                                    color={theme.colors.textPrimary}
                                  />
                                }
                                size="small"
                                onPress={() =>
                                  setExerciseTypeEdits((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      metrics: moveMetric(prev[item.id].metrics, idx, 'up'),
                                    },
                                  }))
                                }
                                disabled={idx === 0}
                              />
                              <IconButton
                                icon={
                                  <FontAwesome
                                    name="arrow-alt-circle-down"
                                    size={32}
                                    color={theme.colors.textPrimary}
                                  />
                                }
                                size="small"
                                onPress={() =>
                                  setExerciseTypeEdits((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      metrics: moveMetric(prev[item.id].metrics, idx, 'down'),
                                    },
                                  }))
                                }
                                disabled={idx === exerciseTypeEdits[item.id].metrics.length - 1}
                              />
                              <IconButton
                                icon={
                                  <FontAwesome
                                    name="times-circle"
                                    size={32}
                                    color={theme.colors.textPrimary}
                                  />
                                }
                                size="small"
                                onPress={() =>
                                  setExerciseTypeEdits((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      metrics: reorderMetrics(
                                        prev[item.id].metrics.filter(
                                          (x) => x.metricId !== m.metricId,
                                        ),
                                      ),
                                    },
                                  }))
                                }
                              />
                            </View>
                          </View>
                        );
                      })
                  )}
                </ScrollView>
              </ModalWrapper>
            )}
          </>
        ),
      };
    });

  const handleCreate = async () => {
    if (mode === 'type') {
      await (createItem as (input: { name: string; metrics: OrderedMetric[] }) => Promise<any>)({
        name: newExerciseType.name,
        metrics: newExerciseType.metrics,
      });
      setNewExerciseType({ name: '', metrics: [] });
    } else {
      await (createItem as (input: string) => Promise<any>)(newValue);
      setNewValue('');
    }
    refetch();
  };

  const handleUpdate = async (id: number) => {
    if (mode === 'type') {
      const updated = exerciseTypeEdits[id];
      if (!updated) return;
      await (
        updateItem as (
          id: number,
          input: { name: string; metrics: OrderedMetric[] },
        ) => Promise<any>
      )(id, { name: updated.name, metrics: updated.metrics });
    } else {
      const updated = edits[id];
      if (!updated || updated === '') return;
      await (updateItem as (id: number, input: string) => Promise<any>)(id, updated);
    }
    refetch();
  };

  const catalogSections: { key: typeof mode; label: string; sublabel: string }[] = [
    {
      key: 'type',
      label: 'Exercise Types',
      sublabel: 'Click to manage exercise types',
    },
    {
      key: 'difficulty',
      label: 'Difficulties',
      sublabel: 'Click to manage difficulties',
    },
    {
      key: 'bodyPart',
      label: 'Body Parts',
      sublabel: 'Click to manage body parts',
    },
    { key: 'muscle', label: 'Muscles', sublabel: 'Click to manage muscles' },
  ];

  return (
    <ScreenLayout scroll>
      <Title text="Manage Exercise Reference Data" subtitle="Admin-only control for metadata" />

      <ScrollView>
        {catalogSections.map((section) => (
          <View key={section.key}>
            {mode === section.key ? (
              <Card>
                <TouchableOpacity onPress={() => setMode(null)}>
                  <Title text={section.label} />
                </TouchableOpacity>

                {mode === section.key && (
                  <>
                    {mode === 'type' ? (
                      <>
                        <FormInput
                          label="Name"
                          value={newExerciseType.name}
                          onChangeText={(val) =>
                            setNewExerciseType((prev) => ({ ...prev, name: val }))
                          }
                        />
                        <SelectableField
                          label="Metrics"
                          value={
                            newExerciseType.metrics
                              .map(
                                (x) =>
                                  metrics.find((m) => m.id === x.metricId)?.name ||
                                  `#${x.metricId}`,
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
                      <ModalWrapper visible onClose={() => setShowNewMetricPicker(false)}>
                        <ScrollView>
                          <Title text="Select metrics" />
                          {metrics.filter(
                            (metric) =>
                              !newExerciseType.metrics.some((m) => m.metricId === metric.id),
                          ).length === 0 ? (
                            <View style={{ paddingBottom: 8 }}>
                              <NoResults message="All available metrics have been selected." />
                            </View>
                          ) : (
                            metrics
                              .filter(
                                (metric) =>
                                  !newExerciseType.metrics.some((m) => m.metricId === metric.id),
                              )
                              .map((metric) => (
                                <OptionItem
                                  key={metric.id}
                                  text={metric.name}
                                  selected={false}
                                  onPress={() => {
                                    setNewExerciseType((prev) => {
                                      const updated = reorderMetrics([
                                        ...prev.metrics,
                                        {
                                          metricId: metric.id,
                                          order: prev.metrics.length + 1,
                                        },
                                      ]);
                                      return { ...prev, metrics: updated };
                                    });
                                  }}
                                />
                              ))
                          )}

                          <Button
                            text="Confirm"
                            fullWidth
                            onPress={() => setShowNewMetricPicker(false)}
                          />

                          <DividerWithLabel label="Order selected metrics" />

                          {newExerciseType.metrics.length > 0 ? (
                            newExerciseType.metrics
                              .sort((a, b) => a.order - b.order)
                              .map((m, idx) => {
                                const metric = metrics.find((x) => x.id === m.metricId);
                                return (
                                  <View
                                    key={m.metricId}
                                    style={{
                                      padding: spacing.sm,
                                      borderRadius: 8,
                                      borderWidth: 1,
                                      borderColor: theme.colors.accentStart,
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                    }}
                                  >
                                    <View style={{ flexDirection: 'column' }}>
                                      <Text
                                        style={{
                                          color: theme.colors.textPrimary,
                                        }}
                                      >
                                        #{idx + 1} {metric?.name}
                                      </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row' }}>
                                      <IconButton
                                        icon={
                                          <FontAwesome
                                            name="arrow-alt-circle-up"
                                            style={{
                                              fontSize: 32,
                                              color: theme.colors.textPrimary,
                                            }}
                                          />
                                        }
                                        size="small"
                                        onPress={() =>
                                          setNewExerciseType((prev) => ({
                                            ...prev,
                                            metrics: moveMetric(prev.metrics, idx, 'up'),
                                          }))
                                        }
                                        disabled={idx === 0}
                                      />
                                      <IconButton
                                        icon={
                                          <FontAwesome
                                            name="arrow-alt-circle-down"
                                            style={{
                                              fontSize: 32,
                                              color: theme.colors.textPrimary,
                                            }}
                                          />
                                        }
                                        size="small"
                                        onPress={() =>
                                          setNewExerciseType((prev) => ({
                                            ...prev,
                                            metrics: moveMetric(prev.metrics, idx, 'down'),
                                          }))
                                        }
                                        disabled={idx === newExerciseType.metrics.length - 1}
                                      />
                                      <IconButton
                                        icon={
                                          <FontAwesome
                                            name="times-circle"
                                            style={{
                                              fontSize: 32,
                                              color: theme.colors.textPrimary,
                                            }}
                                          />
                                        }
                                        size="small"
                                        onPress={() =>
                                          setNewExerciseType((prev) => ({
                                            ...prev,
                                            metrics: reorderMetrics(
                                              prev.metrics.filter((x) => x.metricId !== m.metricId),
                                            ),
                                          }))
                                        }
                                      />
                                    </View>
                                  </View>
                                );
                              })
                          ) : (
                            <NoResults message="No metrics selected yet." />
                          )}
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
                }}
              >
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
