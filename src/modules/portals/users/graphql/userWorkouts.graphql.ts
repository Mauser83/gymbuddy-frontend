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
        gymEquipmentId
        setNumber
        reps
        weight
        rpe
        notes
      }
    }
  }
`;
