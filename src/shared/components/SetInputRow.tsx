import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';

import { useMetricRegistry } from 'src/shared/context/MetricRegistry';
import { useTheme } from 'src/shared/theme/ThemeProvider';

interface BottomSheetPickerProps {
  visible: boolean;
  options: { label: string; value: number }[];
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
  const { theme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            {label ? (
              <Text style={[styles.modalLabel, { color: theme.colors.textPrimary }]}>{label}</Text>
            ) : null}
            <Picker
              selectedValue={selectedValue}
              onValueChange={onValueChange}
              style={{ color: theme.colors.textPrimary }}
            >
              {options.map((opt) => (
                <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
              ))}
            </Picker>
            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: theme.colors.accentStart }]}
              onPress={onClose}
            >
              <Text style={{ color: theme.colors.buttonText }}>Done</Text>
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

export default function SetInputRow({ metricIds, values, onChange }: SetInputRowProps) {
  const { metricRegistry } = useMetricRegistry();
  const { theme } = useTheme();
  const [rpeModalVisible, setRpeModalVisible] = useState(false);
  const [restModalVisible, setRestModalVisible] = useState(false);
  const activeRpeMetric = useRef<number | null>(null);
  const activeRestMetric = useRef<number | null>(null);
  const longPressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [textValues, setTextValues] = useState<Record<number, string>>({});
  const [focusedMetric, setFocusedMetric] = useState<number | null>(null);
  const inputRefs = useRef<Record<number, TextInput | null>>({});

  useEffect(() => {
    return () => {
      stopAdjust();
    };
  }, []);

  const clampValue = (id: number, value: number) => {
    const metric = metricRegistry[id];
    const name = metric?.name.toLowerCase();
    if (name === 'weight') return Math.max(0, value);
    if (name === 'reps') return Math.max(1, Math.round(value));
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
    void Haptics.selectionAsync();
    let nextValue = 0;
    setTextValues((prev) => {
      const base = prev[id] ?? values[id] ?? 0;
      const current = Number(base);
      nextValue = clampValue(id, current + delta);
      return { ...prev, [id]: String(nextValue) };
    });
    onChange(id, nextValue);
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
      const minWidth = name === 'weight' ? 72 : 56;
      const maxWidth = name === 'weight' ? 84 : 64;
      const isFocused = focusedMetric === metricId;
      return (
        <View
          key={metricId}
          style={[
            styles.metricColumn,
            { backgroundColor: theme.colors.surface, minWidth, maxWidth },
          ]}
        >
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{metric.name}</Text>
          <View
            style={[
              styles.pillInput,
              {
                minWidth,
                maxWidth,
                backgroundColor: theme.colors.glass.background,
              },
              isFocused && { backgroundColor: theme.colors.accentStart },
            ]}
          >
            <TextInput
              ref={(ref) => {
                inputRefs.current[metricId] = ref;
              }}
              style={[
                styles.valueInput,
                {
                  color: isFocused ? theme.colors.buttonText : theme.colors.textPrimary,
                },
              ]}
              keyboardType={name === 'weight' ? 'decimal-pad' : 'numeric'}
              value={value}
              onFocus={() => {
                setFocusedMetric(metricId);
                const ref = inputRefs.current[metricId];
                const len = value.length;
                ref?.setNativeProps({ selection: { start: 0, end: len } });
              }}
              onBlur={() => setFocusedMetric(null)}
              onChangeText={(text) => setTextValues((prev) => ({ ...prev, [metricId]: text }))}
              onEndEditing={() => {
                const raw = textValues[metricId];
                const prevValue = Number(values[metricId] ?? (name === 'reps' ? 1 : 0));
                if (raw == null || raw.trim() === '') {
                  setTextValues((prev) => ({
                    ...prev,
                    [metricId]: String(prevValue),
                  }));
                  onChange(metricId, prevValue);
                  return;
                }
                const parsed = Number(raw.replace(',', '.'));
                if (isNaN(parsed)) {
                  setTextValues((prev) => ({
                    ...prev,
                    [metricId]: String(prevValue),
                  }));
                  onChange(metricId, prevValue);
                  return;
                }
                const clamped = clampValue(metricId, parsed);
                setTextValues((prev) => ({ ...prev, [metricId]: String(clamped) }));
                onChange(metricId, clamped);
              }}
              numberOfLines={1}
            />
          </View>
          <View style={[styles.adjustRow, { width: '100%' }]}>
            <Pressable
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel={`decrement ${metric.name}`}
              onPressIn={() => startAdjust(metricId, -increment)}
              onPressOut={stopAdjust}
              style={({ pressed }) => [
                styles.adjustButton,
                {
                  backgroundColor: theme.colors.glass.background,
                  borderColor: theme.colors.cardBorder,
                },
                pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
              ]}
            >
              <Text style={[styles.adjustButtonText, { color: theme.colors.textPrimary }]}>-</Text>
            </Pressable>
            <Pressable
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityLabel={`increment ${metric.name}`}
              onPressIn={() => startAdjust(metricId, increment)}
              onPressOut={stopAdjust}
              style={({ pressed }) => [
                styles.adjustButton,
                {
                  backgroundColor: theme.colors.glass.background,
                  borderColor: theme.colors.cardBorder,
                },
                pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
              ]}
            >
              <Text style={[styles.adjustButtonText, { color: theme.colors.textPrimary }]}>+</Text>
            </Pressable>
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
            {
              borderColor: theme.colors.cardBorder,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>RPE</Text>
          <Pressable
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={() => {
              activeRpeMetric.current = metricId;
              setRpeModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.pill,
              { backgroundColor: theme.colors.accentStart },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={[styles.pillText, { color: theme.colors.buttonText }]}>{selected}</Text>
          </Pressable>
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
            {
              borderColor: theme.colors.cardBorder,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Rest</Text>
          <Pressable
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={() => {
              activeRestMetric.current = metricId;
              setRestModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.pill,
              { backgroundColor: theme.colors.accentStart },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text
              style={[styles.pillText, { color: theme.colors.buttonText }]}
              numberOfLines={1}
              ellipsizeMode="clip"
            >
              {formatTime(selected)}
            </Text>
          </Pressable>
        </View>
      );
    }

    // Fallback generic input
    return (
      <View key={metricId} style={styles.item}>
        <Text style={[styles.genericLabel, { color: theme.colors.textPrimary }]}>
          {metric.name}:
        </Text>
        <TextInput
          style={[
            styles.genericInput,
            {
              borderColor: theme.colors.accentStart,
              color: theme.colors.textPrimary,
            },
          ]}
          value={String(values[metricId] ?? '')}
          onChangeText={(text) => onChange(metricId, text)}
        />
      </View>
    );
  };
  return (
    <View style={styles.row}>
      {metricIds.map((id) => renderMetric(id))}
      <BottomSheetPicker
        label="RPE"
        visible={rpeModalVisible}
        onClose={() => setRpeModalVisible(false)}
        selectedValue={activeRpeMetric.current ? Number(values[activeRpeMetric.current] ?? 1) : 1}
        onValueChange={(val) => {
          if (activeRpeMetric.current != null) {
            onChange(activeRpeMetric.current, val);
          }
        }}
        options={Array.from({ length: 10 }, (_, i) => ({
          label: `${i + 1}`,
          value: i + 1,
        }))}
      />
      <BottomSheetPicker
        label="Rest"
        visible={restModalVisible}
        onClose={() => setRestModalVisible(false)}
        selectedValue={activeRestMetric.current ? Number(values[activeRestMetric.current] ?? 0) : 0}
        onValueChange={(val) => {
          if (activeRestMetric.current != null) {
            onChange(activeRestMetric.current, val);
          }
        }}
        options={Array.from({ length: 13 }, (_, i) => i * 15).map((v) => ({
          label: formatTime(v),
          value: v,
        }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  adjustButton: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    height: 36,
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  adjustButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  adjustRow: {
    flexDirection: 'row',
    marginTop: 2,
    width: '100%',
  },
  box: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doneButton: {
    alignSelf: 'flex-end',
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  genericInput: {
    borderRadius: 4,
    borderWidth: 1,
    minWidth: 40,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  genericLabel: {
    fontSize: 13,
    marginRight: 4,
  },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: 4,
  },
  label: {
    fontSize: 12,
    marginBottom: 0,
  },
  metricColumn: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalContent: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  pill: {
    borderRadius: 16,
    minWidth: 60,
    paddingHorizontal: 8,
    paddingVertical: 3, // ensures "1:30" always fits in one line
  },
  pillInput: {
    alignItems: 'center',
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 3,
    width: '100%',
  },
  pillText: {
    fontSize: 20,
    fontVariant: ['tabular-nums'],
    fontWeight: 'bold',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  valueInput: {
    fontSize: 19,
    fontVariant: ['tabular-nums'],
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },
});
