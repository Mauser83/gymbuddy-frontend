import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {spacing} from 'shared/theme/tokens';
import Icon from '@expo/vector-icons/Feather';
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

  const groupedLogs = new Map<number, ExerciseLog[]>();
  exerciseLogs.forEach(log => {
    const current = groupedLogs.get(log.exerciseId) || [];
    groupedLogs.set(log.exerciseId, [...current, log]);
  });

  const {metricRegistry} = useMetricRegistry();

  const formatMetrics = (metrics: PlanExercise['targetMetrics']): string => {
    return metrics
      .map(({metricId, min, max}) => {
        const name = metricRegistry[metricId]?.name;
        if (!name) return null;
        if (max != null && max !== '' && max !== min) {
          return `${name} ${min}–${max}`;
        }
        return `${name} ${min}`;
      })
      .filter(Boolean)
      .join(', ');
  };

  return (
    <Portal>
      {!expanded && (
        <View
          style={[
            styles.collapsedWrapper,
            {borderColor: theme.colors.accentStart},
          ]}>
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
            {borderColor: theme.colors.accentStart},
          ]}>
          <TouchableOpacity
            style={styles.expandedBox}
            activeOpacity={1}
            onPress={() => setExpanded(false)}>
            <View style={styles.headerRow}>
              <Text style={styles.headerText}>Plan</Text>
            </View>
            {planExercises.flatMap((ex, planIdx) =>
              Array.from({length: ex.targetSets}).map((_, setIdx) => {
                const setsLogged = groupedLogs.get(ex.exerciseId)?.length || 0;
                const currentSetIndex = setIdx;
                const isLogged = currentSetIndex < setsLogged;

                const overallIdx =
                  planExercises
                    .slice(0, planIdx)
                    .reduce((sum, p) => sum + p.targetSets, 0) + setIdx;

                return (
                  <View
                    key={`e${ex.exerciseId}s${setIdx}`}
                    style={styles.exerciseItem}>
                    <Text
                      style={
                        styles.name
                      }>{`${overallIdx + 1}. ${ex.name}`}</Text>
                    {isLogged ? (
                      <Text style={{color: 'green'}}>✅ Completed</Text>
                    ) : (
                      <Text style={styles.details}>
                        {formatMetrics(ex.targetMetrics)}
                      </Text>
                    )}
                  </View>
                );
              }),
            )}
          </TouchableOpacity>
        </View>
      )}
    </Portal>
  );
}

const styles = StyleSheet.create({
  collapsedWrapper: {
    position: 'absolute',
    top: Dimensions.get('window').height / 2,
    right: 0,
    transform: [{translateY: -50}],
    zIndex: 999,
    alignItems: 'flex-end',
  },
  expandedWrapper: {
    position: 'absolute',
    top: Dimensions.get('window').height / 2,
    right: 0,
    transform: [{translateY: -Dimensions.get('window').height * 0.25}],
    zIndex: 999,
    alignItems: 'flex-end',
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
