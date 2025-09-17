import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Portal } from 'react-native-portalize';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { useTheme } from 'src/shared/theme/ThemeProvider';
import { borderWidth, spacing } from 'src/shared/theme/tokens';

import { useExerciseLogSummary } from './ExerciseLogSummary';
import { ExerciseLog } from '../types/userWorkouts.types';

const HEADER_HEIGHT = 61;

interface ProgressChecklistProps {
  exerciseLogs: ExerciseLog[];
  exerciseNames?: Record<number, string>;
  onSelect?: (key: string, exerciseId: number) => void;
}

export default function ProgressChecklist({
  exerciseLogs = [],
  exerciseNames = {},
  onSelect,
}: ProgressChecklistProps) {
  const [expanded, setExpanded] = useState(false);
  const { theme } = useTheme();
  const formatSummary = useExerciseLogSummary();
  const topOffset = HEADER_HEIGHT + spacing.sm;
  const maxHeight = Dimensions.get('window').height - topOffset - spacing.sm;

  const grouped = useMemo(() => {
    const map = new Map<string, { exerciseId: number; logs: ExerciseLog[] }>();
    for (const log of exerciseLogs) {
      const key = log.instanceKey ?? `${log.exerciseId}-0`;
      if (!map.has(key)) {
        map.set(key, { exerciseId: log.exerciseId, logs: [] });
      }
      map.get(key)!.logs.push(log);
    }
    return Array.from(map.entries()).map(([k, data]) => {
      data.logs.sort((a, b) => a.setNumber - b.setNumber);
      return [k, data] as [string, { exerciseId: number; logs: ExerciseLog[] }];
    });
  }, [exerciseLogs]);

  return (
    <Portal>
      {!expanded && (
        <View
          style={[
            styles.collapsedWrapper,
            {
              top: topOffset,
              borderColor: theme.colors.accentStart,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.collapsedTab}
            onPress={() => setExpanded(true)}
            activeOpacity={0.9}
          >
            {['P', 'R', 'O', 'G'].map((letter) => (
              <Text key={letter} style={styles.verticalLetter}>
                {letter}
              </Text>
            ))}
          </TouchableOpacity>
        </View>
      )}

      {expanded && (
        <Animated.View
          entering={SlideInRight.duration(150)}
          exiting={SlideOutRight.duration(150)}
          style={[
            styles.expandedWrapper,
            {
              top: topOffset,
              borderColor: theme.colors.accentStart,
              maxHeight,
            },
          ]}
        >
          <View style={styles.expandedBox}>
            <View style={styles.headerRow}>
              <Text style={styles.headerText}>Progress</Text>
              <TouchableOpacity onPress={() => setExpanded(false)} style={styles.closeButton}>
                <FontAwesome name="times" size={20} color="#222" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {grouped.map(([key, group]) => (
                <TouchableOpacity
                  key={key}
                  style={styles.exerciseItem}
                  onPress={() => onSelect?.(key, group.exerciseId)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.name}>
                      {exerciseNames[group.exerciseId] ?? `Exercise #${group.exerciseId}`}
                    </Text>
                  </View>
                  {group.logs.map((log) => (
                    <Text key={log.id} style={styles.details}>
                      {formatSummary(log)}
                    </Text>
                  ))}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      )}
    </Portal>
  );
}

const styles = StyleSheet.create({
  closeButton: { padding: 4 },
  collapsedTab: {
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
    borderBottomLeftRadius: 8,
    borderTopLeftRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  collapsedWrapper: {
    alignItems: 'flex-end',
    borderBottomLeftRadius: 10,
    borderRightWidth: 0,
    borderTopLeftRadius: 10,
    borderWidth: borderWidth.thick,
    position: 'absolute',
    right: 0,
    zIndex: 999,
  },
  details: {
    color: '#444',
    fontSize: 12,
  },
  exerciseItem: {
    marginBottom: spacing.sm,
  },
  expandedBox: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 12,
    borderTopLeftRadius: 12,
    elevation: 6,
    maxWidth: 260,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  expandedWrapper: {
    alignItems: 'flex-end',
    borderBottomLeftRadius: 14,
    borderRightWidth: 0,
    borderTopLeftRadius: 14,
    borderWidth: borderWidth.thick,
    position: 'absolute',
    right: 0,
    zIndex: 999,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerText: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
  },
  name: {
    color: '#222',
    fontSize: 14,
    fontWeight: 'bold',
  },
  verticalLetter: {
    color: '#444',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
