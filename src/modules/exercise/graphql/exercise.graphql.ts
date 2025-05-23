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
  query GetExercises($search: String) {
    getExercises(search: $search) {
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