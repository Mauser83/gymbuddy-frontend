import {gql} from '@apollo/client';

export const GET_WORKOUT_PLAN_META = gql`
  query GetWorkoutPlanMetaData {
    getTrainingGoals {
      id
      name
      slug
    }
    getIntensityPresets {
      id
      trainingGoalId
      trainingGoal {
        id
        name
      }
      experienceLevel
      defaultSets
      defaultReps
      defaultRestSec
      defaultRpe
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
      trainingGoal {
        id
        name
        slug
      }
      intensityPreset {
        id
        experienceLevel
        defaultSets
        defaultReps
        defaultRestSec
        defaultRpe
        trainingGoalId
        trainingGoal {
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

export const GET_INTENSITY_PRESETS = gql`
  query GetIntensityPresets($trainingGoalId: Int) {
    getIntensityPresets(trainingGoalId: $trainingGoalId) {
      id
      trainingGoalId
      trainingGoal {
        id
        name
      }
      experienceLevel
      defaultSets
      defaultReps
      defaultRestSec
      defaultRpe
    }
  }
`;
