// WorkoutPlanSummary.tsx
import { useMetricRegistry } from 'shared/context/MetricRegistry';

type TargetMetric = {
  metricId: number;
  min: string | number;
  max?: string | number | null; // ← allow null
};

type PlanExercise = {
  exerciseId: number;
  targetMetrics: TargetMetric[];
  targetSets?: number;
};

export const useWorkoutPlanSummary = () => {
  const { metricRegistry, getPlanningRelevantMetricIdsForExercise } = useMetricRegistry();

  return (exercise: PlanExercise): string => {
    const metricIds = getPlanningRelevantMetricIdsForExercise(exercise.exerciseId);
    const targetMetrics = exercise.targetMetrics;

    const parts: string[] = [];

    for (const metricId of metricIds) {
      const def = metricRegistry[metricId];
      if (!def) continue;

      const target = targetMetrics.find((m) => m.metricId === metricId);
      if (!target || target.min === '' || target.min === null) continue;

      const min = target.min;
      const max = target.max ?? '';
      const isRange = max !== '' && max !== null && max !== min;

      const label = def.name;
      const unit = def.unit;

      if (label === 'Reps') {
        parts.push(isRange ? `${min}–${max} reps` : `${min} reps`);
      } else if (label === 'RPE') {
        parts.push(`RPE ${min}`);
      } else if (label === 'Rest time') {
        parts.push(isRange ? `Rest ${min}–${max}${unit}` : `Rest ${min}${unit}`);
      } else {
        parts.push(isRange ? `${min}–${max} ${unit}` : `${min} ${unit}`);
      }
    }

    if (exercise.targetSets && !isNaN(exercise.targetSets)) {
      parts.unshift(`${exercise.targetSets} sets`);
    }

    return parts.join(', ');
  };
};
