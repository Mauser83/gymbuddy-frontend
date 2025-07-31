// ✅ Make this a utility instead of a component
import {useMetricRegistry} from 'shared/context/MetricRegistry';

export const useExerciseLogSummary = () => {
  const { getMetricIdsForExercise, metricRegistry, exerciseTypeByExerciseId } =
    useMetricRegistry();

  return (log: {
    setNumber: number;
    exerciseId: number;
    metrics?: Record<number, string | number>;
  }): string => {
    const metricIds = getMetricIdsForExercise(log.exerciseId);
    const exerciseTypeId = exerciseTypeByExerciseId[log.exerciseId];
    const metrics = log.metrics ?? {};

    // 🏋️ For strength-type exercises
    if (exerciseTypeId === 1) {
      const summaryMetricIds = metricIds.filter(id =>
        ['Weight', 'Reps', 'RPE'].includes(metricRegistry[id]?.name),
      );

      const weight = summaryMetricIds[0] != null ? metrics[summaryMetricIds[0]] : null;
      const reps = summaryMetricIds[1] != null ? metrics[summaryMetricIds[1]] : null;
      const rpe = summaryMetricIds[2] != null ? metrics[summaryMetricIds[2]] : null;

      const parts: string[] = [];
      if (weight !== undefined && weight !== null) parts.push(`${weight} kg`);
      if (reps !== undefined && reps !== null) parts.push(`x ${reps}`);

      const rpeText =
        rpe !== undefined && rpe !== null ? `RPE ${rpe}` : '';

      const contentParts = [];
      const joined = parts.join(' ').trim();
      if (joined) contentParts.push(joined);
      if (rpeText) contentParts.push(rpeText);

      const content = contentParts.join(', ');
      return content ? `Set ${log.setNumber}: ${content}` : `Set ${log.setNumber}`;
    }

    // 🧪 Fallback: generic summary
    const values = metricIds
      .map(id => {
        const val = metrics[id];
        const metric = metricRegistry[id];
        if (val == null || !metric) return null;
        return `${val} ${metric.unit}`;
      })
      .filter(Boolean)
      .join(', ');

    return `Set ${log.setNumber}: ${values}`;
  };
};