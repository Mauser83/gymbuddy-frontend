import {gql} from '@apollo/client';

export const GET_MY_WORKOUT_PLANS = gql`
  query GetMyWorkoutPlans {
    workoutPlans {
      id
      name
      description
    }
  }
`;

export const GET_SHARED_WORKOUT_PLANS = gql`
  query GetSharedWorkoutPlans {
    sharedWorkoutPlans {
      id
      name
      description
    }
  }
`;

export const GET_WORKOUT_PLANS = gql`
  query GetWorkoutPlans {
    workoutPlans {
      id
      name
      description
    }
  }
`;

export const GET_GYMS = gql`
  query GetGyms($search: String) {
    gyms(search: $search) {
      id
      name
      address
      city
      country
    }
  }
`;

export const GET_EXERCISES_AVAILABLE_AT_GYM = gql`
  query GetExercisesAvailableAtGym($gymId: Int!, $search: String) {
    exercisesAvailableAtGym(gymId: $gymId, search: $search) {
      id
      name
      description
      equipmentSlots {
        options {
          subcategory {
            id
            name
          }
        }
      }
      exerciseType {
        id
      }
    }
  }
`;

export const GET_GYM_EQUIPMENT = gql`
  query GetGymEquipment($gymId: Int!) {
    gymEquipmentByGymId(gymId: $gymId) {
      id
      equipment {
        id
        name
        subcategory {
          id
        }
      }
    }
  }
`;

export const CREATE_WORKOUT_SESSION = gql`
  mutation CreateWorkoutSession($input: CreateWorkoutSessionInput!) {
    createWorkoutSession(input: $input) {
      id
    }
  }
`;

export const GET_ACTIVE_WORKOUT_SESSION = gql`
  query GetActiveWorkoutSession($userId: Int!) {
    activeWorkoutSession(userId: $userId) {
      id
    }
  }
`;

export const GET_WORKOUT_SESSION = gql`
  query GetWorkoutSession($id: Int!) {
    workoutSessionById(id: $id) {
      id
      gym {
        id
        name
      }
      workoutPlan {
        id
        name
        exercises {
          exercise {
            id
            name
          }
          groupId
          trainingMethod {
            id
            name
          }
          targetSets
          targetMetrics {
            metricId
            min
            max
          }
        }
        groups {
          id
          order
          trainingMethodId
        }
      }
      exerciseLogs {
        id
        exerciseId
        setNumber
        equipmentIds
        metrics
        notes
      }
    }
  }
`;

export const CREATE_EXERCISE_LOG = gql`
  mutation CreateExerciseLog($input: CreateExerciseLogInput!) {
    createExerciseLog(input: $input) {
      id
      exerciseId
      setNumber
      metrics
      notes
      equipmentIds
    }
  }
`;

export const UPDATE_EXERCISE_LOG = gql`
  mutation UpdateExerciseLog($id: Int!, $input: UpdateExerciseLogInput!) {
    updateExerciseLog(id: $id, input: $input) {
      id
      exerciseId
      setNumber
      metrics
      notes
      equipmentIds
    }
  }
`;

export const DELETE_EXERCISE_LOG = gql`
  mutation DeleteExerciseLog($id: Int!) {
    deleteExerciseLog(id: $id)
  }
`;

export const UPDATE_WORKOUT_SESSION = gql`
  mutation UpdateWorkoutSession($id: Int!, $input: UpdateWorkoutSessionInput!) {
    updateWorkoutSession(id: $id, input: $input) {
      id
      endedAt
    }
  }
`;

export const DELETE_WORKOUT_SESSION = gql`
  mutation DeleteWorkoutSession($id: Int!) {
    deleteWorkoutSession(id: $id)
  }
`;

export const GET_FILTER_OPTIONS = gql`
  query GetFilterOptions {
    allExerciseTypes {
      id
      name
    }
    allExerciseDifficulties {
      id
      level
    }
    allBodyParts {
      id
      name
      muscles {
        id
        name
        bodyPart {
          id
          name
        }
      }
    }
  }
`;

export const GET_WORKOUT_SESSIONS_BY_USER = gql`
  query GetWorkoutSessionsByUser($userId: Int!) {
    workoutSessionsByUser(userId: $userId) {
      id
      startedAt
      endedAt
      notes
      workoutPlan {
        id
        name
      }
      gym {
        id
        name
      }
      exerciseLogs {
        id
        metrics
      }
    }
  }
`;

export const GET_WORKOUT_SESSION_DETAIL = gql`
  query GetWorkoutSession($id: Int!) {
    workoutSessionById(id: $id) {
      id
      startedAt
      endedAt
      notes
      gym {
        id
        name
      }
      workoutPlan {
        id
        name
      }
      exerciseLogs {
        id
        exerciseId
        setNumber
        metrics
        notes
        exercise {
          id
          name
          exerciseType {
            id
          }
          primaryMuscles {
            id
            name
            bodyPart {
              id
              name
            }
          }
        }
      }
    }
  }
`;
