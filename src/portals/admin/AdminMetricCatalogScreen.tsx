import React, {useState} from 'react';
import {ScrollView, View, Switch} from 'react-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import SelectableField from 'shared/components/SelectableField';
import ModalWrapper from 'shared/components/ModalWrapper';
import OptionItem from 'shared/components/OptionItem';
import ClickableList from 'shared/components/ClickableList';
import DividerWithLabel from 'shared/components/DividerWithLabel';
import {spacing} from 'shared/theme/tokens';
import {useTheme} from 'shared/theme/ThemeProvider';
import FontAwesome from '@expo/vector-icons/FontAwesome5';
import {useQuery, useMutation} from '@apollo/client';
import {GET_ALL_METRICS_AND_EXERCISE_TYPES} from 'shared/graphql/metrics.graphql';
import {
  CREATE_METRIC,
  UPDATE_METRIC,
  DELETE_METRIC,
} from 'features/exercises/graphql/exerciseReference.graphql';
import {CreateMetricInput} from 'features/exercises/hooks/useReferenceManagement';
import ButtonRow from 'shared/components/ButtonRow';

const INPUT_TYPES = ['number', 'decimal', 'time', 'text'];

export default function AdminMetricCatalogScreen() {
  const {theme} = useTheme();
  const {data, refetch} = useQuery(GET_ALL_METRICS_AND_EXERCISE_TYPES);
  const [createMetric] = useMutation(CREATE_METRIC, {
    onCompleted: () => refetch(),
  });
  const [updateMetric] = useMutation(UPDATE_METRIC, {
    onCompleted: () => refetch(),
  });
  const [deleteMetric] = useMutation(DELETE_METRIC, {
    onCompleted: () => refetch(),
  });
  const metrics = data?.allMetrics || [];
  const [metricEdits, setMetricEdits] = useState<
    Record<number, Partial<CreateMetricInput>>
  >({});
  const [newMetric, setNewMetric] = useState<CreateMetricInput>({
    name: '',
    slug: '',
    unit: '',
    inputType: 'number',
    useInPlanning: false,
    minOnly: false,
  });
  const [pickerMetricId, setPickerMetricId] = useState<number | 'new' | null>(
    null,
  );
  const [expandedId, setExpandedId] = useState<number | null>(null);

  function slugify(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  const showInputTypeSelector = (id: number | 'new') => setPickerMetricId(id);

  const handleCreate = async () => {
    await createMetric({variables: {input: newMetric}});
    setNewMetric({
      name: '',
      slug: '',
      unit: '',
      inputType: 'number',
      useInPlanning: false,
      minOnly: false,
    });
  };

  return (
    <ScreenLayout scroll>
      <Title text="Manage Metrics" subtitle="Admin-only control for metrics" />
      <ScrollView style={{padding: spacing.md}}>
        <FormInput
          label="Name"
          value={newMetric.name}
          onChangeText={val =>
            setNewMetric(prev => ({...prev, name: val, slug: slugify(val)}))
          }
        />
        <FormInput
          label="Unit"
          value={newMetric.unit}
          onChangeText={val => setNewMetric(prev => ({...prev, unit: val}))}
        />
        <SelectableField
          label="Input Type"
          value={newMetric.inputType}
          onPress={() => showInputTypeSelector('new')}
        />
        <View
          style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
          <Switch
            value={newMetric.useInPlanning}
            onValueChange={val =>
              setNewMetric(prev => ({...prev, useInPlanning: val}))
            }
            trackColor={{true: theme.colors.accentStart, false: 'grey'}}
            thumbColor={theme.colors.accentEnd}
          />
          <Title subtitle="Use in Planning" />
        </View>
        <View
          style={{flexDirection: 'row', alignItems: 'center', marginTop: 8}}>
          <Switch
            value={newMetric.minOnly}
            onValueChange={val =>
              setNewMetric(prev => ({...prev, minOnly: val}))
            }
            trackColor={{true: theme.colors.accentStart, false: 'grey'}}
            thumbColor={theme.colors.accentEnd}
          />
          <Title subtitle="Min Only?" />
        </View>
        <Button text="Create" fullWidth onPress={handleCreate} />

        <DividerWithLabel label="Existing Metrics" />
        <ClickableList
          items={metrics.map((metric: any) => ({
            id: metric.id,
            label: metric.name,
            subLabel: metric.slug,
            selected: expandedId === metric.id,
            rightElement:
              expandedId === metric.id ? (
                <FontAwesome
                  name="chevron-down"
                  size={16}
                  color={theme.colors.accentStart}
                />
              ) : null,
            onPress: () => {
              setExpandedId(prev => (prev === metric.id ? null : metric.id));
              setMetricEdits(prev => ({
                ...prev,
                [metric.id]: {
                  name: metric.name,
                  slug: metric.slug,
                  unit: metric.unit,
                  inputType: metric.inputType,
                  useInPlanning: metric.useInPlanning,
                  minOnly: metric.minOnly,
                },
              }));
            },
            content: expandedId === metric.id && (
              <View style={{marginTop: spacing.sm}}>
                <FormInput
                  label="Name"
                  value={metricEdits[metric.id]?.name || metric.name}
                  onChangeText={val =>
                    setMetricEdits(prev => ({
                      ...prev,
                      [metric.id]: {...prev[metric.id], name: val},
                    }))
                  }
                />
                <FormInput
                  label="Unit"
                  value={metricEdits[metric.id]?.unit || metric.unit}
                  onChangeText={val =>
                    setMetricEdits(prev => ({
                      ...prev,
                      [metric.id]: {...prev[metric.id], unit: val},
                    }))
                  }
                />
                <SelectableField
                  label="Input Type"
                  value={metricEdits[metric.id]?.inputType || metric.inputType}
                  onPress={() => showInputTypeSelector(metric.id)}
                />
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 8,
                  }}>
                  <Switch
                    value={
                      metricEdits[metric.id]?.useInPlanning ??
                      metric.useInPlanning
                    }
                    onValueChange={val =>
                      setMetricEdits(prev => ({
                        ...prev,
                        [metric.id]: {...prev[metric.id], useInPlanning: val},
                      }))
                    }
                    trackColor={{true: theme.colors.accentStart, false: 'grey'}}
                    thumbColor={theme.colors.accentEnd}
                  />
                  <Title subtitle="Use in Planning" />
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 8,
                  }}>
                  <Switch
                    value={metricEdits[metric.id]?.minOnly ?? metric.minOnly}
                    onValueChange={val =>
                      setMetricEdits(prev => ({
                        ...prev,
                        [metric.id]: {...prev[metric.id], minOnly: val},
                      }))
                    }
                    trackColor={{true: theme.colors.accentStart, false: 'grey'}}
                    thumbColor={theme.colors.accentEnd}
                  />
                  <Title subtitle="Min Only?" />
                </View>
                <ButtonRow>
                <Button
                  text="Update"
                  fullWidth
                  onPress={() =>
                    updateMetric({
                      variables: {id: metric.id, input: metricEdits[metric.id]},
                    })
                  }
                />
                <Button
                  text="Delete"
                  fullWidth
                  onPress={() => deleteMetric({variables: {id: metric.id}})}
                />
                </ButtonRow>
              </View>
            ),
          }))}
        />
      </ScrollView>

      {pickerMetricId !== null && (
        <ModalWrapper visible onClose={() => setPickerMetricId(null)}>
          <Title text="Select Input Type" />
          {INPUT_TYPES.map(type => (
            <OptionItem
              key={type}
              text={type}
              onPress={() => {
                if (pickerMetricId === 'new') {
                  setNewMetric(prev => ({...prev, inputType: type}));
                } else {
                  setMetricEdits(prev => ({
                    ...prev,
                    [pickerMetricId]: {
                      ...prev[pickerMetricId],
                      inputType: type,
                    },
                  }));
                }
                setPickerMetricId(null);
              }}
            />
          ))}
          <Button
            text="Close"
            fullWidth
            onPress={() => setPickerMetricId(null)}
          />
        </ModalWrapper>
      )}
    </ScreenLayout>
  );
}