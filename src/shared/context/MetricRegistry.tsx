import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ALL_METRICS_AND_EXERCISE_TYPES } from 'shared/graphql/metrics.graphql';
import { useAuth } from 'modules/auth/context/AuthContext';

export type MetricDefinition = {
  id: number;
  name: string;
  unit: string;
  inputType: 'number' | 'time' | 'text';
  useInPlanning: boolean;
  minOnly: boolean;
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

export const buildGetPlanningRelevantMetricIdsForExercise = (
  registry: Record<number, MetricDefinition>,
  exerciseTypeByExerciseId: Record<number, number>,
  exerciseMetricMap: Record<number, number[]>
) => (exerciseId: number): number[] => {
  const typeId = exerciseTypeByExerciseId[exerciseId];
  const allMetricIds = exerciseMetricMap[typeId] ?? [];
  return allMetricIds.filter(id => registry[id]?.useInPlanning);
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
        useInPlanning: m.useInPlanning,
        minOnly: m.minOnly,
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
      exerciseMetricMap
    );
    return getRelevant(exerciseId).map(id => {
      const metric = registry[id];
      return metric && metric.minOnly
        ? {metricId: id, min: ''}
        : {metricId: id, min: '', max: ''};
    });
  };

  const getPlanningRelevantMetricIdsForExercise = buildGetPlanningRelevantMetricIdsForExercise(
    registry,
    exerciseTypeByExerciseId,
    exerciseMetricMap
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
