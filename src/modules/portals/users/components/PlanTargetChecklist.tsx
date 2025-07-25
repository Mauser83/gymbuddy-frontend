import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Animated, {SlideInRight, SlideOutRight} from 'react-native-reanimated';
import {borderRadius, borderWidth, spacing} from 'shared/theme/tokens';
import {Portal} from 'react-native-portalize';
import {useTheme} from 'shared/theme/ThemeProvider';
import {useMetricRegistry} from 'shared/context/MetricRegistry';
import ExerciseGroupCard from '../../../../shared/components/ExerciseGroupCard';
import {ExerciseLog} from '../types/userWorkouts.types';

const HEADER_HEIGHT = 61;

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
  isAlternating?: boolean;
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
  onSelect?: (groupKey: string, exerciseId: number) => void;
}

export default function PlanTargetChecklist({
  planExercises,
  groups = [],
  exerciseLogs,
  onSelect,
}: PlanTargetChecklistProps) {
  const [expanded, setExpanded] = useState(false);
  const {theme} = useTheme();
  const topOffset = HEADER_HEIGHT + spacing.sm;
  const maxHeight = Dimensions.get('window').height - topOffset - spacing.sm;
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
    | {
        type: 'group';
        group: {id: number; name: string; exercises: PlanExercise[]};
      }
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

  type PlanInstance = {planEx: PlanExercise; globalIdx: number; key: string};
  const planInstances: PlanInstance[] = [];
  const counts: Record<number, number> = {};
  let globalIdxCounter = 0;
  for (const item of displayList) {
    if (item.type === 'exercise') {
      const idx = counts[item.exercise.exerciseId] ?? 0;
      counts[item.exercise.exerciseId] = idx + 1;
        planInstances.push({
        planEx: item.exercise,
        globalIdx: globalIdxCounter,
        key: `${item.exercise.exerciseId}-${idx}`,
      });
      globalIdxCounter++;
    } else {
      for (const ex of item.group.exercises) {
        const idx = counts[ex.exerciseId] ?? 0;
        counts[ex.exerciseId] = idx + 1;
        planInstances.push({
          planEx: ex,
          globalIdx: globalIdxCounter,
          key: `${ex.exerciseId}-${idx}`,
        });
        globalIdxCounter++;
      }
    }
  }

  const groupedLogs = useMemo(() => {
    const map = new Map<string, ExerciseLog[]>();
    for (const log of exerciseLogs ?? []) {
      const key = log.instanceKey ?? `${log.exerciseId}-0`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(log);
    }
    return map;
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
          ]}>
          <View style={styles.expandedBox}>
            <View style={styles.headerRow}>
              <Text style={styles.headerText}>Plan</Text>
              <TouchableOpacity
                onPress={() => setExpanded(false)}
                style={styles.closeButton}>
                <FontAwesome name="times" size={20} color="#222" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {(() => {
                let instanceIdx = 0;
                return displayList.map(item => {
                  if (item.type === 'exercise') {
                    const instance = planInstances[instanceIdx++];
                    const planEx = instance.planEx;
                    const completed = groupedLogs.get(instance.key)?.length ?? 0;
                    const itemKey = instance.key;
                    return (
                      <TouchableOpacity
                        key={`ex-${planEx.exerciseId}-${instance.globalIdx}`}
                        style={styles.exerciseItem}
                        onPress={() => onSelect?.(itemKey, planEx.exerciseId)}>
                        <View
                          style={{flexDirection: 'row', alignItems: 'center'}}>
                          <Text style={styles.name}>{planEx.name}</Text>
                          {completed >= planEx.targetSets ? (
                            <Text style={{marginLeft: 4, color: 'green'}}>
                              ✔️
                            </Text>
                          ) : null}
                        </View>
                        <Text style={styles.details}>
                          {formatMetrics(planEx.targetMetrics)} ({completed}/
                          {planEx.targetSets} sets)
                        </Text>
                      </TouchableOpacity>
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
                        const instance = planInstances[instanceIdx++];
                        const completed = groupedLogs.get(instance.key)?.length ?? 0;
                        const itemKey = instance.key;
                        return (
                          <TouchableOpacity
                            key={ex.exerciseId}
                            style={styles.exerciseItem}
                            onPress={() => onSelect?.(itemKey, ex.exerciseId)}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                              }}>
                              <Text style={styles.name}>{ex.name}</Text>
                              {completed >= ex.targetSets ? (
                                <Text style={{marginLeft: 4, color: 'green'}}>
                                  ✔️
                                </Text>
                              ) : null}
                            </View>
                            <Text style={styles.details}>
                              {formatMetrics(ex.targetMetrics)} ({completed}/
                              {ex.targetSets} sets)
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ExerciseGroupCard>
                  );
                });
              })()}
            </ScrollView>
          </View>
        </Animated.View>
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
  closeButton: {padding: 4},
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
