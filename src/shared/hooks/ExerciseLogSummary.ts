// ExerciseLogSummary.ts
import { useMetricRegistry } from 'src/shared/context/MetricRegistry';

export const useExerciseLogSummary = () => {
  const { getMetricIdsForExercise, metricRegistry, exerciseTypeByExerciseId } = useMetricRegistry();

  return (log: {
    setNumber: number;
    exerciseId: number;
    metrics?: Record<number, string | number>;
  }): string => {
    const metricIds = getMetricIdsForExercise(log.exerciseId);
    const metrics = log.metrics ?? {};

    const exerciseTypeId = exerciseTypeByExerciseId[log.exerciseId];

    // Only apply the "strength" formatting if the type is known to be strength-based
    if (exerciseTypeId === 1) {
      const metricMap = Object.fromEntries(metricIds.map((id) => [metricRegistry[id]?.name, id]));

      const weight = Number(metrics[metricMap['Weight']]);
      const reps = Number(metrics[metricMap['Reps']]);
      const rpe = Number(metrics[metricMap['RPE']]);

      const parts = [];
      if (!isNaN(weight)) parts.push(`${weight} kg`);
      if (!isNaN(reps)) parts.push(`x ${reps}`);
      const rpeText = !isNaN(rpe) ? `RPE ${rpe}` : '';

      const summary = [parts.join(' '), rpeText].filter(Boolean).join(', ');
      return summary ? `Set ${log.setNumber}: ${summary}` : `Set ${log.setNumber}`;
    }

    // Generic fallback for other types
    const values = metricIds
      .map((id) => {
        const val = metrics[id];
        const metric = metricRegistry[id];
        if (val == null || !metric) return null;
        return `${val} ${metric.unit}`;
      })
      .filter(Boolean)
      .join(', ');

    return values ? `Set ${log.setNumber}: ${values}` : `Set ${log.setNumber}`;
  };
};
