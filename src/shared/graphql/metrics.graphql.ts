// 📁 shared/graphql/metrics.graphql.ts
import { gql } from '@apollo/client';

export const GET_ALL_METRICS_AND_EXERCISE_TYPES = gql`
  query GET_ALL_METRICS_AND_EXERCISE_TYPES {
    allMetrics {
      id
      name
      slug
      unit
      inputType
      useInPlanning
      minOnly
    }
    allExerciseTypes {
      id
      name
      orderedMetrics {
        order
        metric {
          id
          name
          unit
          inputType
        }
      }
    }
    getExercises {
      id
      exerciseType {
        id
      }
    }
  }
`;
