import {gql} from '@apollo/client';

export const GET_WORKOUT_PLAN_META = gql`
  query GetWorkoutPlanMetaData {
    getTrainingGoals {
      id
      name
      trainingMethods {
        id
        name
        slug
        minGroupSize
        maxGroupSize
        shouldAlternate
      }
    }
    getIntensityPresets {
      id
      trainingGoalId
      experienceLevelId
      trainingGoal {
        id
        name
      }
      experienceLevel {
        id
        name
        key
        isDefault
      }
      metricDefaults {
        metricId
        defaultMin
        defaultMax
      }
    }
    experienceLevels {
      id
      name
      key
      isDefault
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
    allBodyParts {
      id
      name
    }
    getTrainingMethods {
      id
      name
      slug
      trainingGoals {
        id
      }
      minGroupSize
      maxGroupSize
      shouldAlternate
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
      exerciseType {
        id
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
        trainingMethods {
          id
          name
          minGroupSize
          maxGroupSize
          shouldAlternate
        }
      }
      intensityPreset {
        id
        experienceLevelId
        experienceLevel {
          id
          name
          key
          isDefault
        }
        metricDefaults {
          metricId
          defaultMin
          defaultMax
        }
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
        order
        targetSets
        targetMetrics {
          metricId
          min
          max
        }
        isWarmup
        trainingMethod {
          id
          name
        }
        groupId
        exercise {
          id
          name
        }
      }
      groups {
        id
        order
        trainingMethodId
      }
    }
  }
`;

export const GET_INTENSITY_PRESETS = gql`
  query GetIntensityPresets($trainingGoalId: Int) {
    getIntensityPresets(trainingGoalId: $trainingGoalId) {
      id
      trainingGoalId
      experienceLevelId
      trainingGoal {
        id
        name
      }
      experienceLevel {
        id
        name
        key
        isDefault
      }
      metricDefaults {
        metricId
        defaultMin
        defaultMax
      }
    }
  }
`;

export const GET_EXPERIENCE_LEVELS = gql`
  query GetExperienceLevels {
    experienceLevels {
      id
      name
      key
      isDefault
    }
  }
`;
