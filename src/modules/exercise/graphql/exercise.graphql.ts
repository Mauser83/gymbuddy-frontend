import {gql} from '@apollo/client';

export const EXERCISE_FIELDS = gql`
  fragment ExerciseFields on Exercise {
    id
    name
    description
    videoUrl
    createdAt
    updatedAt

    difficulty {
      id
      level
    }

    exerciseType {
      id
      name
    }

    primaryMuscles {
      id
      name
      bodyPart {
        id
        name
      }
    }

    secondaryMuscles {
      id
      name
      bodyPart {
        id
        name
      }
    }

    equipmentSlots {
      slotIndex
      isRequired
      comment
      options {
        subcategory {
          id
        }
      }
    }
  }
`;

export const GET_MY_EXERCISES = gql`
  query GetMyExercises {
    getExercises {
      ...ExerciseFields
    }
  }
  ${EXERCISE_FIELDS}
`;

export const CREATE_EXERCISE = gql`
  mutation CreateExercise($input: CreateExerciseInput!) {
    createExercise(input: $input) {
      ...ExerciseFields
    }
  }
  ${EXERCISE_FIELDS}
`;

export const UPDATE_EXERCISE = gql`
  mutation UpdateExercise($id: Int!, $input: UpdateExerciseInput!) {
    updateExercise(id: $id, input: $input) {
      ...ExerciseFields
    }
  }
  ${EXERCISE_FIELDS}
`;

export const DELETE_EXERCISE = gql`
  mutation DeleteExercise($id: Int!) {
    deleteExercise(id: $id)
  }
`;

export const GET_EXERCISES = gql`
  query GetExercises($search: String, $filters: ExerciseFilterInput) {
    getExercises(search: $search, filters: $filters) {
      id
      name
      videoUrl
      description
      difficulty {
        id
        level
      }
      primaryMuscles {
        id
        name
        bodyPart {
          id
          name
        }
      }
      secondaryMuscles {
        id
        name
        bodyPart {
          id
          name
        }
      }
      equipmentSlots {
        slotIndex
        isRequired
        comment
        options {
          subcategory {
            id
            name
            category {
              id
              name
            }
          }
        }
      }
    }
  }
`;

export const GET_EXERCISE_DETAIL = gql`
  query GetExerciseDetail($id: Int!) {
    getExerciseById(id: $id) {
      id
      name
      description
      videoUrl
      difficulty {
        level
      }
      exerciseType {
        name
      }
      primaryMuscles {
        name
        bodyPart {
          name
        }
      }
      secondaryMuscles {
        name
        bodyPart {
          name
        }
      }
      equipmentSlots {
        slotIndex
        isRequired
        comment
        options {
          subcategory {
            name
            category {
              name
            }
          }
        }
      }
    }
  }
`;


export const WORKOUT_SESSION_FIELDS = gql`
  fragment WorkoutSessionFields on WorkoutSession {
    id
    userId
    startedAt
    endedAt
    notes
    exerciseLogs {
      id
      exerciseId
      reps
      weight
      setNumber
      createdAt
    }
  }
`;

export const GET_WORKOUT_SESSIONS_BY_USER = gql`
  query GetWorkoutSessionsByUser($userId: Int!) {
    workoutSessionsByUser(userId: $userId) {
      ...WorkoutSessionFields
    }
  }
  ${WORKOUT_SESSION_FIELDS}
`;