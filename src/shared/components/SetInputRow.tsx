import React from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {useMetricRegistry} from 'shared/context/MetricRegistry';
import {useTheme} from 'shared/theme/ThemeProvider';

interface SetInputRowProps {
  metricIds: number[];
  values: Record<number, string | number>;
  onChange: (metricId: number, value: string | number) => void;
}

export default function SetInputRow({
  metricIds,
  values,
  onChange,
}: SetInputRowProps) {
  const {metricRegistry} = useMetricRegistry();
  const {theme} = useTheme();
  return (
    <View style={styles.row}>
      {metricIds.map(id => {
        const metric = metricRegistry[id];
        if (!metric) return null;
        return (
          <View key={id} style={styles.item}>
            <Text style={[styles.label, {color: theme.colors.textPrimary}]}>
              {metric.name}:
            </Text>
            <TextInput
              style={[styles.input, {borderColor: theme.colors.accentStart}]}
              value={String(values[id] ?? '')}
              onChangeText={text =>
                onChange(
                  id,
                  metric.inputType === 'number' ? Number(text) : text,
                )
              }
              keyboardType={
                metric.inputType === 'number' ? 'numeric' : 'default'
              }
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginRight: 4,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 40,
  },
});