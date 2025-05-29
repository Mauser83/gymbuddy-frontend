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

export const GET_EXERCISES_BASIC = gql`
  query getExercises {
    getExercises {
      id
      name
      primaryMuscles {
        bodyPart {
          id
          name
        }
      }
    }
  }
`;

export const GET_WORKOUT_PLAN_BY_ID = gql`
  query GetWorkoutPlanById($id: Int!) {
    workoutPlanById(id: $id) {
      id
      name
      workoutType {
        id
        name
        categories {
          id
          name
        }
      }
      muscleGroups {
        id
        name
      }
      exercises {
        id
        targetSets
        targetReps
        targetRpe
        isWarmup
        trainingMethod {
          id
          name
        }
        exercise {
          id
          name
        }
      }
    }
  }
`;
