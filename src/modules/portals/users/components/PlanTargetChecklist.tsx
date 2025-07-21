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
import ExerciseGroupCard from '../../../../shared/components/ExerciseGroupCard';
import {ExerciseLog} from '../types/userWorkouts.types';

export interface PlanExercise {
  exerciseId: number;
  name: string;
  targetSets: number;
  targetMetrics: {
    metricId: number;
    min: number | string;
    max?: number | string | null;
  }[];
  groupId?: number | null;
  trainingMethod?: {
    id: number;
    name: string;
  } | null;
}

export interface PlanGroup {
  id: number;
  order?: number | null;
  trainingMethodId?: number | null;
}

interface PlanTargetChecklistProps {
  planExercises: PlanExercise[];
  groups?: PlanGroup[];
  exerciseLogs?: ExerciseLog[];
}

export default function PlanTargetChecklist({
  planExercises,
  groups = [],
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

const groupMap: Record<
    number,
    {id: number; name: string; exercises: PlanExercise[]; order?: number | null}
  > = {};
  groups.forEach(g => {
    groupMap[g.id] = {...g, name: '', exercises: []};
  });


  const encounteredGroups = new Set<number>();
  const displayList: (
    | {type: 'exercise'; exercise: PlanExercise}
    | {type: 'group'; group: {id: number; name: string; exercises: PlanExercise[]}}
  )[] = [];

    planExercises.forEach(ex => {
    if (ex.groupId && groupMap[ex.groupId]) {
      if (!groupMap[ex.groupId].name && ex.trainingMethod) {
        groupMap[ex.groupId].name = ex.trainingMethod.name;
      }
      groupMap[ex.groupId].exercises.push(ex);
            if (!encounteredGroups.has(ex.groupId)) {
        displayList.push({type: 'group', group: groupMap[ex.groupId]});
        encounteredGroups.add(ex.groupId);
      }
    } else {
      displayList.push({type: 'exercise', exercise: ex});
    }
  });

  type PlanInstance = {planEx: PlanExercise; globalIdx: number};
  const planInstances: PlanInstance[] = [];
  let globalIdxCounter = 0;
  for (const item of displayList) {
    if (item.type === 'exercise') {
      planInstances.push({planEx: item.exercise, globalIdx: globalIdxCounter});
      globalIdxCounter++;
    } else {
      for (const ex of item.group.exercises) {
        planInstances.push({planEx: ex, globalIdx: globalIdxCounter});
        globalIdxCounter++;
      }
    }
  }

    // Group logs by consecutive set numbers so each instance claims the correct logs
  const groupedLogs = useMemo(() => {
    const groups: {exerciseId: number; logs: ExerciseLog[]}[] = [];
    let current: {exerciseId: number; logs: ExerciseLog[]} | null = null;

    (exerciseLogs ?? []).forEach(log => {
      const shouldStartNew =
        !current ||
        current.exerciseId !== log.exerciseId ||
        log.setNumber !== (current.logs.at(-1)?.setNumber ?? 0) + 1;

      if (shouldStartNew) {
        if (current) groups.push(current);
        current = {exerciseId: log.exerciseId, logs: [log]};
      } else {
        current!.logs.push(log);
      }
    });

    if (current) groups.push(current);

      // Merge with any previous group if numbering continues
    const merged: typeof groups = [];
    for (const group of groups) {
      let mergedInto = false;
      for (let i = merged.length - 1; i >= 0; i--) {
        const prev = merged[i];
        if (
          prev.exerciseId === group.exerciseId &&
          group.logs[0]?.setNumber === (prev.logs.at(-1)?.setNumber ?? 0) + 1
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

  // Mutable copy for sequential consumption during render
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
      <View style={[
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
          onPress={() => setExpanded(false)}
        >
          <View style={styles.headerRow}>
            <Text style={styles.headerText}>Plan</Text>
          </View>

          {(() => {
              return displayList.map(item => {
                if (item.type === 'exercise') {
                  const planEx = item.exercise;
                  let matchedLogs: ExerciseLog[] = [];
                  const idx = remainingGroups.findIndex(
                    g => g.exerciseId === planEx.exerciseId,
                  );
                  if (idx !== -1) {
                    const group = remainingGroups.splice(0, idx + 1).pop();
                    if (group) matchedLogs = group.logs.slice(0, planEx.targetSets);
                  }
                  const completed = matchedLogs.length;
                  return (
                    <View key={`ex-${planEx.exerciseId}-${completed}`} style={styles.exerciseItem}>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        <Text style={styles.name}>{planEx.name}</Text>
                        {completed >= planEx.targetSets ? (
                          <Text style={{marginLeft: 4, color: 'green'}}>✔️</Text>
                        ) : null}
                      </View>
                      <Text style={styles.details}>
                        {formatMetrics(planEx.targetMetrics)} ({completed}/
                        {planEx.targetSets} sets)
                      </Text>
                    </View>
                  );
                }
                return (
                  <ExerciseGroupCard
                    key={`group-${item.group.id}`}
                    label={item.group.name || 'Group'}
                    borderColor={theme.colors.accentStart}
                    textColor={theme.colors.accentStart}
                      backgroundColor="white">
                    {item.group.exercises.map(ex => {
                      let matchedLogs: ExerciseLog[] = [];
                      const idx = remainingGroups.findIndex(
                        g => g.exerciseId === ex.exerciseId,
                      );
                      if (idx !== -1) {
                        const group = remainingGroups.splice(0, idx + 1).pop();
                        if (group) matchedLogs = group.logs.slice(0, ex.targetSets);
                      }
                      const completed = matchedLogs.length;
                      return (
                        <View key={ex.exerciseId} style={styles.exerciseItem}>
                          <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Text style={styles.name}>{ex.name}</Text>
                            {completed >= ex.targetSets ? (
                              <Text style={{marginLeft: 4, color: 'green'}}>✔️</Text>
                            ) : null}
                          </View>
                          <Text style={styles.details}>
                            {formatMetrics(ex.targetMetrics)} ({completed}/
                            {ex.targetSets} sets)
                          </Text>
                        </View>
                      );
                    })}
                  </ExerciseGroupCard>
                );
              });
            })()}
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
