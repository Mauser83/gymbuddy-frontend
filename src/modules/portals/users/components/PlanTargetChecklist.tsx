import React, {useState} from 'react';
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

  // Copy logs so we can consume in order
  const remainingLogs = [...exerciseLogs];

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
              const matchedLogs: ExerciseLog[] = [];

              // Match this instance's sets from remaining logs
              for (let i = 0; i < ex.targetSets && remainingLogs.length > 0; i++) {
                const idx = remainingLogs.findIndex(
                  log => log.exerciseId === ex.exerciseId
                );
                if (idx !== -1) {
                  matchedLogs.push(remainingLogs[idx]);
                  remainingLogs.splice(idx, 1);
                } else {
                  break;
                }
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
