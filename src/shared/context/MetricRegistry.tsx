import React, {createContext, useContext, useEffect, useState} from 'react';
import {useQuery} from '@apollo/client';
import {GET_ALL_METRICS_AND_EXERCISE_TYPES} from 'shared/graphql/metrics.graphql';
import {useAuth} from 'modules/auth/context/AuthContext';

type MetricDefinition = {
  id: number;
  name: string;
  unit: string;
  inputType: 'number' | 'time' | 'text';
};

type MetricRegistryContextType = {
  metricRegistry: Record<number, MetricDefinition>;
  exerciseMetricMap: Record<number, number[]>; // exerciseTypeId → ordered metricIds
  exerciseTypeByExerciseId: Record<number, number>; // 🔧 Add this
  loading: boolean;
  getMetricIdsForExercise: (exerciseId: number) => number[];
  createDefaultMetricsForExercise: (
    exerciseId: number,
  ) => Record<number, number>;
};

const MetricRegistryContext = createContext<MetricRegistryContextType | null>(
  null,
);

export const useMetricRegistry = () => {
  const ctx = useContext(MetricRegistryContext);
  if (!ctx) {
    throw new Error(
      'MetricRegistryContext must be used within MetricRegistryProvider',
    );
  }
  return ctx;
};

export const MetricRegistryProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const {user} = useAuth();
  const {data, loading} = useQuery(GET_ALL_METRICS_AND_EXERCISE_TYPES, {
    skip: !user, // ✅ only fetch if logged in
  });

  const [registry, setRegistry] = useState<Record<number, MetricDefinition>>(
    {},
  );
  const [exerciseMetricMap, setExerciseMetricMap] = useState<
    Record<number, number[]>
  >({});
  const [exerciseTypeByExerciseId, setExerciseTypeByExerciseId] = useState<
    Record<number, number>
  >({});

  useEffect(() => {
    if (!data) return;

    // Build metric registry
    const metrics: Record<number, MetricDefinition> = {};
    data.allMetrics.forEach((m: any) => {
      metrics[m.id] = {
        id: m.id,
        name: m.name,
        unit: m.unit,
        inputType: m.inputType,
      };
    });

    // Build exercise type → metricIds map
    const typeToMetrics: Record<number, number[]> = {};
    data.allExerciseTypes.forEach((ex: any) => {
      typeToMetrics[ex.id] = [...(ex.orderedMetrics ?? [])]
        .sort((a, b) => a.order - b.order)
        .map(entry => entry.metric.id);
    });

    // Build exerciseId → exerciseTypeId map
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
    exerciseId: number,
  ): Record<number, number> => {
    const ids = getMetricIdsForExercise(exerciseId);
    return Object.fromEntries(ids.map(id => [id, 0]));
  };

  return (
    <MetricRegistryContext.Provider
      value={{
        metricRegistry: registry,
        exerciseMetricMap,
        exerciseTypeByExerciseId,
        loading,
        getMetricIdsForExercise,
        createDefaultMetricsForExercise,
      }}>
      {children}
    </MetricRegistryContext.Provider>
  );
};
