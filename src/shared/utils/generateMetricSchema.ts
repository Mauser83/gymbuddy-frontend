// 🧪 Example Usage in Formik Validation
// validationSchema={Yup.object(
//   Object.fromEntries(
//     logs.map(log => [
//       log.id,
//       Yup.object().shape({
//         metrics: generateMetricSchema(
//           exerciseMetricMap[log.exerciseId] ?? [],
//           metricRegistry
//         ),
//         notes: Yup.string().nullable(),
//         equipmentIds: Yup.array()
//           .of(Yup.number())
//           .min(1, 'Select at least one equipment item'),
//       }),
//     ])
//   )
// )}

import * as Yup from 'yup';

type MetricRegistry = Record<
  number,
  {
    name: string;
    inputType: 'number' | 'time' | 'text';
  }
>;

export function generateMetricSchema(
  metricIds: number[],
  metricRegistry: MetricRegistry
): Yup.ObjectSchema<Record<number, unknown>> {
  const fields: Record<number, Yup.AnySchema> = {};

  for (const id of metricIds) {
    const metric = metricRegistry[id];
    if (!metric) continue;

    let schema: Yup.AnySchema;

    switch (metric.inputType) {
      case 'number':
        schema = Yup.number()
          .typeError(`${metric.name} must be a number`)
          .min(0, `${metric.name} must be at least 0`)
          .required(`${metric.name} is required`);
        break;

      case 'time':
        schema = Yup.string()
          .matches(/^\d+(:[0-5]?\d)?$/, `${metric.name} must be in seconds or mm:ss`)
          .required(`${metric.name} is required`);
        break;

      case 'text':
        schema = Yup.string()
          .max(200, `${metric.name} must be under 200 characters`)
          .required(`${metric.name} is required`);
        break;

      default:
        schema = Yup.string().required(`${metric.name} is required`);
    }

    fields[id] = schema;
  }

  return Yup.object().shape(fields);
}
