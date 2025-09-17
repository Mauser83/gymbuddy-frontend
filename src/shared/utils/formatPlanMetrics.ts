import { MetricDefinition } from 'shared/context/MetricRegistry';

export function formatPlanMetrics(
  metrics: { metricId: number; min: number | string; max?: number | string | null }[],
  registry: Record<number, MetricDefinition>,
): string {
  return metrics
    .map(({ metricId, min, max }) => {
      const name = registry[metricId]?.name;
      if (!name) return null;
      if (max != null && max !== '' && max !== min) {
        return `${name} ${min}–${max}`;
      }
      return `${name} ${min}`;
    })
    .filter(Boolean)
    .join(', ');
}
