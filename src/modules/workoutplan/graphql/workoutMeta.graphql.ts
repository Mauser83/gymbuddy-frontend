import {gql} from '@apollo/client';

export const GET_WORKOUT_PLAN_META = gql`
  query GetWorkoutPlanMetaData {
    getWorkoutCategories {
      id
      name
      slug
      workoutTypes {
        id
        name
        slug
      }
    }
    getWorkoutTypes {
      id
      name
      slug
    }
    getMuscleGroups {
      id
      name
      slug
      bodyParts {
        id
        name
      }
    }
    getTrainingMethods {
      id
      name
      slug
      description
    }
    allBodyParts {
      id
      name
    }
  }
`;
