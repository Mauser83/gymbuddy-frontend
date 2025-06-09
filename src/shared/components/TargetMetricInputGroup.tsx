// ✅ Usage Example
// <TargetMetricInputGroup
//   exerciseId={exercise.exerciseId}
//   values={exercise.targetMetrics}
//   onChange={(metricId, field, value) => {
//     const updated = exercise.targetMetrics.map(m =>
//       m.metricId === metricId ? { ...m, [field]: value } : m
//     );
//     setFieldValue(`exercises[${index}].targetMetrics`, updated);
//   }}
//   errors={errors.exercises?.[index]?.targetMetrics}
//   touched={touched.exercises?.[index]?.targetMetrics}
// />

import React from 'react';
import {View} from 'react-native';
import FormInput from 'shared/components/FormInput';
import {useMetricRegistry} from 'shared/context/MetricRegistry';

interface TargetMetric {
  metricId: number;
  min: number | string;
  max?: number | string;
}

interface TargetMetricInputGroupProps {
  exerciseId: number;
  values: TargetMetric[];
  onChange: (metricId: number, field: 'min' | 'max', value: string) => void;
  errors?: Record<number, {min?: string; max?: string}>;
  touched?: Record<number, {min?: boolean; max?: boolean}>;
}

const TargetMetricInputGroup: React.FC<TargetMetricInputGroupProps> = ({
  exerciseId,
  values,
  onChange,
  errors = {},
  touched = {},
}) => {
  const {metricRegistry, exerciseMetricMap} = useMetricRegistry();
  const metricIds = exerciseMetricMap[exerciseId] ?? [];

  return (
    <View style={{gap: 12}}>
      {metricIds.map(metricId => {
        const metric = metricRegistry[metricId];
        if (!metric) return null;

        const target = values.find(m => m.metricId === metricId) ?? {
          metricId,
          min: '',
          max: '',
        };

        return (
          <View key={metricId} style={{gap: 8}}>
            <FormInput
              label={`Min ${metric.name} (${metric.unit})`}
              value={String(target.min ?? '')}
              onChangeText={text => onChange(metricId, 'min', text)}
              keyboardType={
                metric.inputType === 'number' ? 'numeric' : 'default'
              }
              error={touched[metricId]?.min ? errors[metricId]?.min : undefined}
            />
            <FormInput
              label={`Max ${metric.name} (${metric.unit})`}
              value={String(target.max ?? '')}
              onChangeText={text => onChange(metricId, 'max', text)}
              keyboardType={
                metric.inputType === 'number' ? 'numeric' : 'default'
              }
              error={touched[metricId]?.max ? errors[metricId]?.max : undefined}
            />
          </View>
        );
      })}
    </View>
  );
};

export default TargetMetricInputGroup;
