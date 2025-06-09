import {MetricDefinition} from 'shared/context/MetricRegistry';

export function formatMetrics(
  metrics: Record<number, number | string>,
  metricIds: number[],
  registry: Record<number, MetricDefinition>,
): string {
  return metricIds
    .map(id => {
      const val = metrics[id];
      const unit = registry[id]?.unit;
      return val != null ? `${val}${unit ? ' ' + unit : ''}` : null;
    })
    .filter(Boolean)
    .join(', ');
}
