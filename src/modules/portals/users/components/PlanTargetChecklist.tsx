import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {borderRadius, borderWidth, spacing} from 'shared/theme/tokens';
import {Portal} from 'react-native-portalize';
import {useTheme} from 'shared/theme/ThemeProvider';
import {useMetricRegistry} from 'shared/context/MetricRegistry';

export interface PlanExercise {
  exerciseId: number;
  name: string;
  targetSets: number;
  targetMetrics: {
    metricId: number;
    min: number | string;
    max?: number | string | null;
  }[];
}

interface ExerciseLog {
  exerciseId: number;
  setNumber: number;
}

interface PlanTargetChecklistProps {
  planExercises: PlanExercise[];
  exerciseLogs: ExerciseLog[];
}

export default function PlanTargetChecklist({
  planExercises,
  exerciseLogs,
}: PlanTargetChecklistProps) {
  const [expanded, setExpanded] = useState(false);
  const {theme} = useTheme();
  const [collapsedHeight, setCollapsedHeight] = useState(0);
  const [expandedHeight, setExpandedHeight] = useState(0);
  const {metricRegistry} = useMetricRegistry();

  const formatMetrics = (metrics: PlanExercise['targetMetrics']): string => {
    return metrics
      .map(({metricId, min, max}) => {
        const name = metricRegistry[metricId]?.name;
        if (!name) return null;
        return max != null && max !== '' && max !== min
          ? `${name} ${min}–${max}`
          : `${name} ${min}`;
      })
      .filter(Boolean)
      .join(', ');
  };

    // Group logs by consecutive exerciseId and set number sequence so
  // repeated exercises form separate instances when numbering resets.
  const groupedLogs = useMemo(() => {
    const groups: {exerciseId: number; logs: ExerciseLog[]}[] = [];
    let current: {exerciseId: number; logs: ExerciseLog[]} | null = null;

    for (const log of exerciseLogs) {
      const lastGroup = groups.at(-1);
      const shouldStartNew =
        !lastGroup ||
        lastGroup.exerciseId !== log.exerciseId ||
        log.setNumber !== (lastGroup.logs.at(-1)?.setNumber ?? 0) + 1;

      if (shouldStartNew) {
        if (current) groups.push(current);
        current = {exerciseId: log.exerciseId, logs: [log]};
      } else {
        current!.logs.push(log);
      }
    }

    if (current) groups.push(current);

    // Merge groups when set numbering continues from a previous group for the
    // same exercise. This ensures sets inserted later remain with their
    // original instance after reloading.
    const merged: typeof groups = [];
    for (const group of groups) {
      let mergedInto = false;
      for (let i = merged.length - 1; i >= 0; i--) {
        const prev = merged[i];
        if (
          prev.exerciseId === group.exerciseId &&
          group.logs[0]?.setNumber ===
            (prev.logs.at(-1)?.setNumber ?? 0) + 1
        ) {
          prev.logs.push(...group.logs);
          mergedInto = true;
          break;
        }
      }
      if (!mergedInto) merged.push(group);
    }

    return merged;
  }, [exerciseLogs]);

  // Copy groups so we can consume them in order
  const remainingGroups = [...groupedLogs];

  return (
    <Portal>
      {!expanded && (
        <View
          style={[
            styles.collapsedWrapper,
            {
              top: '50%',
              transform: [{translateY: -collapsedHeight / 2}],
              borderColor: theme.colors.accentStart,
            },
          ]}
          onLayout={e => setCollapsedHeight(e.nativeEvent.layout.height)}>
          <TouchableOpacity
            style={styles.collapsedTab}
            onPress={() => setExpanded(true)}
            activeOpacity={0.9}>
            {['P', 'L', 'A', 'N'].map(letter => (
              <Text key={letter} style={styles.verticalLetter}>
                {letter}
              </Text>
            ))}
          </TouchableOpacity>
        </View>
      )}

      {expanded && (
        <View
          style={[
            styles.expandedWrapper,
            {
              top: '50%',
              transform: [{translateY: -expandedHeight / 2}],
              borderColor: theme.colors.accentStart,
            },
          ]}
          onLayout={e => setExpandedHeight(e.nativeEvent.layout.height)}>
          <TouchableOpacity
            style={styles.expandedBox}
            activeOpacity={1}
            onPress={() => setExpanded(false)}>
            <View style={styles.headerRow}>
              <Text style={styles.headerText}>Plan</Text>
            </View>

            {planExercises.flatMap((ex, planIdx) => {
              // Consume the next group for this exercise, if any
              let matchedLogs: ExerciseLog[] = [];
              const idx = remainingGroups.findIndex(
                g => g.exerciseId === ex.exerciseId
              );
              if (idx !== -1) {
                const group = remainingGroups.splice(0, idx + 1).pop();
                if (group) matchedLogs = group.logs.slice(0, ex.targetSets);
              }

              return Array.from({length: ex.targetSets}).map((_, setIdx) => {
                const isLogged = setIdx < matchedLogs.length;

                const overallIdx =
                  planExercises
                    .slice(0, planIdx)
                    .reduce((sum, p) => sum + p.targetSets, 0) + setIdx;

                return (
                  <View
                    key={`plan${planIdx}_set${setIdx}`}
                    style={styles.exerciseItem}>
                    <Text style={styles.name}>
                      {`${overallIdx + 1}. ${ex.name}`}
                    </Text>
                    {isLogged ? (
                      <Text style={{color: 'green'}}>✅ Completed</Text>
                    ) : (
                      <Text style={styles.details}>
                        {formatMetrics(ex.targetMetrics)}
                      </Text>
                    )}
                  </View>
                );
              });
            })}
          </TouchableOpacity>
        </View>
      )}
    </Portal>
  );
}

const styles = StyleSheet.create({
  collapsedWrapper: {
    position: 'absolute',
    right: 0,
    zIndex: 999,
    alignItems: 'flex-end',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: borderWidth.thick,
    borderRightWidth: 0,
  },
  expandedWrapper: {
    position: 'absolute',
    right: 0,
    zIndex: 999,
    alignItems: 'flex-end',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    borderWidth: borderWidth.thick,
    borderRightWidth: 0,
  },
  collapsedTab: {
    backgroundColor: '#f1f1f1',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    alignItems: 'center',
  },
  verticalLetter: {
    fontWeight: 'bold',
    color: '#444',
    fontSize: 12,
  },
  expandedBox: {
    backgroundColor: 'white',
    padding: spacing.sm,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: -2, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
    maxWidth: 260,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  exerciseItem: {
    marginBottom: spacing.sm,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#222',
  },
  details: {
    fontSize: 12,
    color: '#444',
  },
});
