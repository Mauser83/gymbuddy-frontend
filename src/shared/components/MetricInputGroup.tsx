// 🧪 Usage Example
// <MetricInputGroup
//   exerciseId={log.exerciseId}
//   values={values[log.id]?.metrics ?? {}}
//   onChange={(metricId, value) => {
//     setFieldValue(`${log.id}.metrics.${metricId}`, value);
//   }}
//   errors={errors[log.id]?.metrics}
//   touched={touched[log.id]?.metrics}
// />

import React from 'react';
import { View } from 'react-native';

import FormInput from 'shared/components/FormInput';
import { useMetricRegistry } from 'shared/context/MetricRegistry';

interface MetricInputGroupProps {
  metricIds: number[];
  values: Record<number, string | number>; // metricId → value
  onChange: (metricId: number, value: string | number) => void;
  errors?: Record<number, string>;
  touched?: Record<number, boolean>;
  disabled?: boolean;
}

const MetricInputGroup: React.FC<MetricInputGroupProps> = ({
  metricIds,
  values,
  onChange,
  errors = {},
  touched = {},
  disabled = false,
}) => {
  const { metricRegistry } = useMetricRegistry();

  return (
    <View style={{ gap: 12 }}>
      {metricIds.map((metricId) => {
        const metric = metricRegistry[metricId];
        if (!metric) return null;

        return (
          <FormInput
            key={metricId}
            label={metric.unit ? `${metric.name} (${metric.unit})` : `${metric.name}`}
            value={
              metric.inputType === 'decimal'
                ? String(values?.[metricId] ?? '').replace('.', ',')
                : String(values?.[metricId] ?? '')
            }
            onChangeText={(text) => {
              if (metric.inputType === 'number') {
                const normalized = text.replace(',', '.');
                const numeric = normalized === '' ? '' : Number(normalized);
                onChange(metricId, numeric);
              } else if (metric.inputType === 'decimal') {
                onChange(metricId, text.replace(',', '.'));
              } else {
                onChange(metricId, text);
              }
            }}
            keyboardType={
              metric.inputType === 'number'
                ? 'number-pad'
                : metric.inputType === 'decimal'
                  ? 'decimal-pad'
                  : metric.inputType === 'time'
                    ? 'default'
                    : 'default'
            }
            error={touched[metricId] && errors[metricId] ? errors[metricId] : undefined}
            editable={!disabled}
          />
        );
      })}
    </View>
  );
};

export default MetricInputGroup;
