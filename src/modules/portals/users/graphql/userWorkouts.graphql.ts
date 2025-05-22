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
      }
      exerciseLogs {
        id
        exerciseId
        equipmentIds
        setNumber
        reps
        weight
        rpe
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
      reps
      weight
      rpe
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
      reps
      weight
      rpe
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
