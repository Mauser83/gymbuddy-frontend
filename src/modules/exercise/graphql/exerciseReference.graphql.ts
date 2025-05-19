import { gql } from '@apollo/client';

export const GET_REFERENCE_DATA = gql`
  query GetExerciseReferenceData {
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

export const GET_EXERCISE_TYPES = gql`
  query GetExerciseTypes {
    allExerciseTypes {
      id
      name
    }
  }
`;

export const CREATE_EXERCISE_TYPE = gql`
  mutation CreateExerciseType($input: CreateExerciseTypeInput!) {
    createExerciseType(input: $input) {
      id
      name
    }
  }
`;

export const UPDATE_EXERCISE_TYPE = gql`
  mutation UpdateExerciseType($id: Int!, $input: UpdateExerciseTypeInput!) {
    updateExerciseType(id: $id, input: $input) {
      id
      name
    }
  }
`;

export const DELETE_EXERCISE_TYPE = gql`
  mutation DeleteExerciseType($id: Int!) {
    deleteExerciseType(id: $id)
  }
`;

export const GET_EXERCISE_DIFFICULTIES = gql`
  query GetExerciseDifficulties {
    allExerciseDifficulties {
      id
      level
    }
  }
`;

export const CREATE_EXERCISE_DIFFICULTY = gql`
  mutation CreateExerciseDifficulty($input: CreateExerciseDifficultyInput!) {
    createExerciseDifficulty(input: $input) {
      id
      level
    }
  }
`;

export const UPDATE_EXERCISE_DIFFICULTY = gql`
  mutation UpdateExerciseDifficulty($id: Int!, $input: UpdateExerciseDifficultyInput!) {
    updateExerciseDifficulty(id: $id, input: $input) {
      id
      level
    }
  }
`;

export const DELETE_EXERCISE_DIFFICULTY = gql`
  mutation DeleteExerciseDifficulty($id: Int!) {
    deleteExerciseDifficulty(id: $id)
  }
`;

export const GET_BODY_PARTS = gql`
  query GetBodyParts {
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

export const CREATE_BODY_PART = gql`
  mutation CreateBodyPart($input: CreateBodyPartInput!) {
    createBodyPart(input: $input) {
      id
      name
    }
  }
`;

export const UPDATE_BODY_PART = gql`
  mutation UpdateBodyPart($id: Int!, $input: UpdateBodyPartInput!) {
    updateBodyPart(id: $id, input: $input) {
      id
      name
    }
  }
`;

export const DELETE_BODY_PART = gql`
  mutation DeleteBodyPart($id: Int!) {
    deleteBodyPart(id: $id)
  }
`;

export const GET_MUSCLES_BY_BODY_PART = gql`
  query MusclesByBodyPart($bodyPartId: Int!) {
    musclesByBodyPart(bodyPartId: $bodyPartId) {
      id
      name
      bodyPart {
        id
        name
      }
    }
  }
`;

export const CREATE_MUSCLE = gql`
  mutation CreateMuscle($input: CreateMuscleInput!) {
    createMuscle(input: $input) {
      id
      name
    }
  }
`;

export const UPDATE_MUSCLE = gql`
  mutation UpdateMuscle($id: Int!, $input: UpdateMuscleInput!) {
    updateMuscle(id: $id, input: $input) {
      id
      name
    }
  }
`;

export const DELETE_MUSCLE = gql`
  mutation DeleteMuscle($id: Int!) {
    deleteMuscle(id: $id)
  }
`;
