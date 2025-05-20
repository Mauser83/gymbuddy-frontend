import {gql} from '@apollo/client';

export const GET_MY_WORKOUTS = gql`
  query GetMyWorkouts {
    workouts {
      id
      name
      description
    }
  }
`;

export const GET_SHARED_WORKOUTS = gql`
  query GetSharedWorkouts {
    sharedWorkouts {
      id
      name
      description
    }
  }
`;

export const GET_WORKOUT_PLANS = gql`
  query GetWorkoutPlans {
    workouts {
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
