import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useMetricRegistry} from 'shared/context/MetricRegistry';
import {useTheme} from 'shared/theme/ThemeProvider';

interface BottomSheetPickerProps {
  visible: boolean;
  options: {label: string; value: number}[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  onClose: () => void;
  label?: string;
}

const BottomSheetPicker = ({
  visible,
  options,
  selectedValue,
  onValueChange,
  onClose,
  label,
}: BottomSheetPickerProps) => {
  const {theme} = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}>
        <TouchableWithoutFeedback>
          <View style={[styles.modalContent, {backgroundColor: theme.colors.surface}]}>
            {label ? (
              <Text style={[styles.modalLabel, {color: theme.colors.textPrimary}]}> 
                {label}
              </Text>
            ) : null}
            <Picker
              selectedValue={selectedValue}
              onValueChange={onValueChange}
              style={{color: theme.colors.textPrimary}}>
              {options.map(opt => (
                <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
              ))}
            </Picker>
            <TouchableOpacity
              style={[styles.doneButton, {backgroundColor: theme.colors.accentStart}]}
              onPress={onClose}>
              <Text style={{color: theme.colors.buttonText}}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

interface SetInputRowProps {
  metricIds: number[];
  values: Record<number, number | string>;
  onChange: (metricId: number, value: number | string) => void;
}

export default function SetInputRow({
  metricIds,
  values,
  onChange,
}: SetInputRowProps) {
  const {metricRegistry} = useMetricRegistry();
  const {theme} = useTheme();
  const [rpeModalVisible, setRpeModalVisible] = useState(false);
  const [restModalVisible, setRestModalVisible] = useState(false);
  const activeRpeMetric = useRef<number | null>(null);
  const activeRestMetric = useRef<number | null>(null);
  const longPressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [textValues, setTextValues] = useState<Record<number, string>>({});

  useEffect(() => {
    return () => {
      stopAdjust();
    };
  }, []);

  const clampValue = (id: number, value: number) => {
    const metric = metricRegistry[id];
    const name = metric?.name.toLowerCase();
    if (name === 'weight') return Math.max(0, value);
    if (name === 'reps') return Math.max(1, value);
    return value;
  };

  const formatTime = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const stopAdjust = () => {
    if (longPressInterval.current) {
      clearInterval(longPressInterval.current);
      longPressInterval.current = null;
    }
  };

  const adjustMetric = (id: number, delta: number) => {
    setTextValues(prev => {
      const base = prev[id] ?? values[id] ?? 0;
      const current = Number(base);
      const next = clampValue(id, current + delta);
      onChange(id, next);
      return {...prev, [id]: String(next)};
    });
  };

  const startAdjust = (id: number, delta: number) => {
    stopAdjust();
    adjustMetric(id, delta);
    longPressInterval.current = setInterval(() => adjustMetric(id, delta), 200);
  };

  const renderMetric = (metricId: number) => {
    const metric = metricRegistry[metricId];
    if (!metric) return null;
    const name = metric.name.toLowerCase();

    if (name === 'weight' || name === 'reps') {
      const increment = name === 'weight' ? 2.5 : 1;
      const value = textValues[metricId] ?? String(values[metricId] ?? '');
      return (
        <View
          key={metricId}
          style={[
            styles.box,
            {borderColor: theme.colors.cardBorder, backgroundColor: theme.colors.surface},
          ]}>
          <Text style={[styles.label, {color: theme.colors.textSecondary}]}> 
            {metric.name}
          </Text>
          <TextInput
            style={[styles.valueInput, {color: theme.colors.textPrimary}]}
            keyboardType="numeric"
            value={value}
            onChangeText={text =>
              setTextValues(prev => ({...prev, [metricId]: text}))
            }
            onEndEditing={() => {
              const raw = textValues[metricId];
              const num = Number(raw);
              const clamped = clampValue(metricId, isNaN(num) ? 0 : num);
              setTextValues(prev => ({...prev, [metricId]: String(clamped)}));
              onChange(metricId, clamped);
            }}
          />
          <View style={styles.adjustRow}>
            <TouchableOpacity
              accessibilityLabel={`decrement ${metric.name}`}
              onPressIn={() => startAdjust(metricId, -increment)}
              onPressOut={stopAdjust}
              style={[styles.adjustButton, {borderRightWidth: 1, borderColor: theme.colors.cardBorder}]}
            >
              <Text style={[styles.adjustText, {color: theme.colors.textPrimary}]}>-
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel={`increment ${metric.name}`}
              onPressIn={() => startAdjust(metricId, increment)}
              onPressOut={stopAdjust}
              style={styles.adjustButton}
            >
              <Text style={[styles.adjustText, {color: theme.colors.textPrimary}]}>+
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (name === 'rpe') {
      const selected = Number(values[metricId] ?? 1);
      return (
        <View
          key={metricId}
          style={[
            styles.box,
            {borderColor: theme.colors.cardBorder, backgroundColor: theme.colors.surface},
          ]}>
          <Text style={[styles.label, {color: theme.colors.textSecondary}]}>RPE</Text>
          <TouchableOpacity
            style={[styles.pill, {backgroundColor: theme.colors.accentStart}]}
            onPress={() => {
              activeRpeMetric.current = metricId;
              setRpeModalVisible(true);
            }}>
            <Text style={[styles.pillText, {color: theme.colors.buttonText}]}> 
              {selected}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (name.includes('rest')) {
      const selected = Number(values[metricId] ?? 0);
      return (
        <View
          key={metricId}
          style={[
            styles.box,
            {borderColor: theme.colors.cardBorder, backgroundColor: theme.colors.surface},
          ]}>
          <Text style={[styles.label, {color: theme.colors.textSecondary}]}>Rest</Text>
          <TouchableOpacity
            style={[styles.pill, {backgroundColor: theme.colors.accentStart}]}
            onPress={() => {
              activeRestMetric.current = metricId;
              setRestModalVisible(true);
            }}>
            <Text style={[styles.pillText, {color: theme.colors.buttonText}]}> 
              {formatTime(selected)}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Fallback generic input
    return (
      <View key={metricId} style={styles.item}>
        <Text style={[styles.genericLabel, {color: theme.colors.textPrimary}]}> 
          {metric.name}:
        </Text>
        <TextInput
          style={[
            styles.genericInput,
            {borderColor: theme.colors.accentStart, color: theme.colors.textPrimary},
          ]}
          value={String(values[metricId] ?? '')}
          onChangeText={text => onChange(metricId, text)}
        />
      </View>
    );
  };

  return (
    <View style={styles.row}>
      {metricIds.map(id => renderMetric(id))}
      <BottomSheetPicker
        label="RPE"
        visible={rpeModalVisible}
        onClose={() => setRpeModalVisible(false)}
        selectedValue={
          activeRpeMetric.current ? Number(values[activeRpeMetric.current] ?? 1) : 1
        }
        onValueChange={val => {
          if (activeRpeMetric.current != null) {
            onChange(activeRpeMetric.current, val);
          }
        }}
        options={Array.from({length: 10}, (_, i) => ({
          label: `${i + 1}`,
          value: i + 1,
        }))}
      />
      <BottomSheetPicker
        label="Rest"
        visible={restModalVisible}
        onClose={() => setRestModalVisible(false)}
        selectedValue={
          activeRestMetric.current ? Number(values[activeRestMetric.current] ?? 0) : 0
        }
        onValueChange={val => {
          if (activeRestMetric.current != null) {
            onChange(activeRestMetric.current, val);
          }
        }}
        options={Array.from({length: 13}, (_, i) => i * 15).map(v => ({
          label: formatTime(v),
          value: v,
        }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  box: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  adjustRow: {
    flexDirection: 'row',
    marginTop: 4,
    width: '100%',
  },
  adjustButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 44,
  },
  adjustText: {
    fontSize: 24,
  },
  valueInput: {
    minWidth: 50,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  genericLabel: {
    marginRight: 4,
    fontSize: 13,
  },
  genericInput: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 40,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  doneButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
});