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
import {View, Text} from 'react-native';
import FormInput from 'shared/components/FormInput';
import {useMetricRegistry} from 'shared/context/MetricRegistry';
import {useTheme} from 'shared/theme/ThemeProvider';

interface TargetMetric {
  metricId: number;
  min: number | string;
  max?: number | string;
}

interface TargetMetricInputGroupProps {
  exerciseId?: number;
  exerciseTypeId?: number;
  values: TargetMetric[];
  onChange: (metricId: number, field: 'min' | 'max', value: string) => void;
  errors?: Record<number, {min?: string; max?: string}>;
  touched?: Record<number, {min?: boolean; max?: boolean}>;
}

const TargetMetricInputGroup: React.FC<TargetMetricInputGroupProps> = ({
  exerciseId,
  exerciseTypeId,
  values,
  onChange,
  errors = {},
  touched = {},
}) => {
  const {
    metricRegistry,
    exerciseTypeByExerciseId,
    getPlanningRelevantMetricIdsForExercise,
  } = useMetricRegistry();

  const {theme} = useTheme();

  const resolvedTypeId =
    exerciseTypeId ??
    (exerciseId ? exerciseTypeByExerciseId[exerciseId] : undefined);

  const metricIds = exerciseId
    ? getPlanningRelevantMetricIdsForExercise(exerciseId)
    : exerciseTypeId !== undefined
      ? getPlanningRelevantMetricIdsForExercise(
          Object.entries(exerciseTypeByExerciseId).find(
            ([, typeId]) => typeId === exerciseTypeId,
          )?.[0] as unknown as number,
        )
      : [];

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
            <Text
              style={{
                fontWeight: '600',
                marginBottom: 4,
                color: theme.colors.textPrimary,
              }}>
              {metric.name}
            </Text>
            <View style={{flexDirection: 'row', gap: 12}}>
              <View style={{flex: 1}}>
                <FormInput
                  label="Min"
                  value={String(target.min ?? '')}
                  onChangeText={text =>
                    onChange(metricId, 'min', text.replace(',', '.'))
                  }
                  keyboardType={
                    metric.inputType === 'number'
                      ? 'number-pad'
                      : metric.inputType === 'decimal'
                        ? 'decimal-pad'
                        : 'default'
                  }
                  error={
                    touched[metricId]?.min ? errors[metricId]?.min : undefined
                  }
                />
              </View>
              {!metric.minOnly && (
                <View style={{flex: 1}}>
                  <FormInput
                    label="Max (optional)"
                    value={String(target.max ?? '')}
                    onChangeText={text =>
                      onChange(metricId, 'max', text.replace(',', '.'))
                    }
                    keyboardType={
                      metric.inputType === 'number'
                        ? 'number-pad'
                        : metric.inputType === 'decimal'
                          ? 'decimal-pad'
                          : 'default'
                    }
                    error={
                      touched[metricId]?.max ? errors[metricId]?.max : undefined
                    }
                  />
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default TargetMetricInputGroup;
