// ✅ Example Usage in Plan Builder Validation
// Yup.object().shape({
//   exercises: Yup.array().of(
//     Yup.object().shape({
//       exerciseId: Yup.number().required(),
//       targetMetrics: generateTargetMetricSchema(
//         exerciseMetricMap[exercise.exerciseId] ?? [],
//         metricRegistry
//       ),
//     })
//   )
// });

import * as Yup from 'yup';

type MetricRegistry = Record<
  number,
  {
    name: string;
    inputType: 'number' | 'decimal' | 'time' | 'text';
  }
>;

export function generateTargetMetricSchema(metricIds: number[], metricRegistry: MetricRegistry) {
  return Yup.array().of(
    Yup.object().shape({
      metricId: Yup.number()
        .required('Metric ID is required')
        .oneOf(metricIds, 'Invalid metric ID'),
      min: Yup.number()
        .typeError('Min must be a number')
        .min(0, 'Min must be at least 0')
        .required('Min is required'),
      max: Yup.number()
        .typeError('Max must be a number')
        .min(0, 'Max must be at least 0')
        .notRequired(),
    }),
  );
}
