import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ALL_METRICS_AND_EXERCISE_TYPES } from 'shared/graphql/metrics.graphql';
import { useAuth } from 'modules/auth/context/AuthContext';

export type MetricDefinition = {
  id: number;
  name: string;
  unit: string;
  inputType: 'number' | 'time' | 'text';
};

type MetricRegistryContextType = {
  metricRegistry: Record<number, MetricDefinition>;
  exerciseMetricMap: Record<number, number[]>;
  exerciseTypeByExerciseId: Record<number, number>;
  loading: boolean;
  getMetricIdsForExercise: (exerciseId: number) => number[];
  createDefaultMetricsForExercise: (exerciseId: number) => Record<number, number>;
  createPlanningTargetMetrics: (
    exerciseId: number
  ) => { metricId: number; min: string | number; max?: string | number }[];
  getPlanningRelevantMetricIdsForExercise: (exerciseId: number) => number[];
};

const MetricRegistryContext = createContext<MetricRegistryContextType | null>(null);

export const useMetricRegistry = () => {
  const ctx = useContext(MetricRegistryContext);
  if (!ctx) {
    throw new Error('MetricRegistryContext must be used within MetricRegistryProvider');
  }
  return ctx;
};

// 🧠 Central filter config
const planningRelevantMetricsByType: Record<number, string[]> = {
  1: ['Reps', 'RPE', 'Rest time', 'Tempo'],  // Strength
  2: ['Duration', 'Distance'],              // Cardio (example)
  3: ['Hold time', 'Rest time'],            // Mobility (example)
};

export const metricsWithOnlyMin: string[] = ['RPE']; // Example

// 🔧 Builder for externalized filter function
export const buildGetPlanningRelevantMetricIdsForExercise = (
  registry: Record<number, MetricDefinition>,
  exerciseTypeByExerciseId: Record<number, number>,
  exerciseMetricMap: Record<number, number[]>,
  planningRelevantMetricsByType: Record<number, string[]>
) => (exerciseId: number): number[] => {
  const typeId = exerciseTypeByExerciseId[exerciseId];
  const allMetricIds = exerciseMetricMap[typeId] ?? [];
  const names = planningRelevantMetricsByType[typeId] ?? [];
  return allMetricIds.filter(id => names.includes(registry[id]?.name));
};

export const MetricRegistryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { data, loading } = useQuery(GET_ALL_METRICS_AND_EXERCISE_TYPES, {
    skip: !user,
  });

  const [registry, setRegistry] = useState<Record<number, MetricDefinition>>({});
  const [exerciseMetricMap, setExerciseMetricMap] = useState<Record<number, number[]>>({});
  const [exerciseTypeByExerciseId, setExerciseTypeByExerciseId] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!data) return;

    // Registry
    const metrics: Record<number, MetricDefinition> = {};
    data.allMetrics.forEach((m: any) => {
      metrics[m.id] = {
        id: m.id,
        name: m.name,
        unit: m.unit,
        inputType: m.inputType,
      };
    });

    // Type → Metrics
    const typeToMetrics: Record<number, number[]> = {};
    data.allExerciseTypes.forEach((ex: any) => {
      typeToMetrics[ex.id] = [...(ex.orderedMetrics ?? [])]
        .sort((a, b) => a.order - b.order)
        .map(entry => entry.metric.id);
    });

    // Exercise → Type
    const exerciseToType: Record<number, number> = {};
    data.getExercises?.forEach((ex: any) => {
      if (ex.id && ex.exerciseType?.id) {
        exerciseToType[ex.id] = ex.exerciseType.id;
      }
    });

    setRegistry(metrics);
    setExerciseMetricMap(typeToMetrics);
    setExerciseTypeByExerciseId(exerciseToType);
  }, [data]);

  const getMetricIdsForExercise = (exerciseId: number): number[] => {
    const typeId = exerciseTypeByExerciseId[exerciseId];
    return exerciseMetricMap[typeId] ?? [];
  };

  const createDefaultMetricsForExercise = (
    exerciseId: number
  ): Record<number, number> => {
    const ids = getMetricIdsForExercise(exerciseId);
    return Object.fromEntries(ids.map(id => [id, 0]));
  };

  const createPlanningTargetMetrics = (
    exerciseId: number
  ): { metricId: number; min: string | number; max?: string | number }[] => {
    const getRelevant = buildGetPlanningRelevantMetricIdsForExercise(
      registry,
      exerciseTypeByExerciseId,
      exerciseMetricMap,
      planningRelevantMetricsByType
    );
    return getRelevant(exerciseId).map(id => ({
      metricId: id,
      min: '',
      max: '',
    }));
  };

  const getPlanningRelevantMetricIdsForExercise = buildGetPlanningRelevantMetricIdsForExercise(
    registry,
    exerciseTypeByExerciseId,
    exerciseMetricMap,
    planningRelevantMetricsByType
  );

  return (
    <MetricRegistryContext.Provider
      value={{
        metricRegistry: registry,
        exerciseMetricMap,
        exerciseTypeByExerciseId,
        loading,
        getMetricIdsForExercise,
        createDefaultMetricsForExercise,
        createPlanningTargetMetrics,
        getPlanningRelevantMetricIdsForExercise,
      }}
    >
      {children}
    </MetricRegistryContext.Provider>
  );
};
