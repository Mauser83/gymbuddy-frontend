import {gql} from '@apollo/client';

// 🏷 Workout Type
export const CREATE_WORKOUT_TYPE = gql`
  mutation CreateWorkoutType($input: CreateWorkoutTypeInput!) {
    createWorkoutType(input: $input) {
      id
      name
      slug
      categories {
        id
        name
      }
    }
  }
`;

export const UPDATE_WORKOUT_TYPE = gql`
  mutation UpdateWorkoutType($id: Int!, $input: UpdateWorkoutTypeInput!) {
    updateWorkoutType(id: $id, input: $input) {
      id
      name
      slug
      categories {
        id
        name
      }
    }
  }
`;

export const DELETE_WORKOUT_TYPE = gql`
  mutation DeleteWorkoutType($id: Int!) {
    deleteWorkoutType(id: $id)
  }
`;

// 💪 Muscle Group
export const CREATE_MUSCLE_GROUP = gql`
  mutation CreateMuscleGroup($input: CreateMuscleGroupInput!) {
    createMuscleGroup(input: $input) {
      id
      name
      slug
      bodyParts {
        id
        name
      }
    }
  }
`;

export const UPDATE_MUSCLE_GROUP = gql`
  mutation UpdateMuscleGroup($id: Int!, $input: UpdateMuscleGroupInput!) {
    updateMuscleGroup(id: $id, input: $input) {
      id
      name
      slug
      bodyParts {
        id
        name
      }
    }
  }
`;

export const DELETE_MUSCLE_GROUP = gql`
  mutation DeleteMuscleGroup($id: Int!) {
    deleteMuscleGroup(id: $id)
  }
`;

// 📂 Workout Category
export const CREATE_WORKOUT_CATEGORY = gql`
  mutation CreateWorkoutCategory($input: CreateWorkoutCategoryInput!) {
    createWorkoutCategory(input: $input) {
      id
      name
      slug
    }
  }
`;

export const UPDATE_WORKOUT_CATEGORY = gql`
  mutation UpdateWorkoutCategory(
    $id: Int!
    $input: UpdateWorkoutCategoryInput!
  ) {
    updateWorkoutCategory(id: $id, input: $input) {
      id
      name
      slug
    }
  }
`;

export const DELETE_WORKOUT_CATEGORY = gql`
  mutation DeleteWorkoutCategory($id: Int!) {
    deleteWorkoutCategory(id: $id)
  }
`;

// 🧪 Training Method
export const CREATE_TRAINING_METHOD = gql`
  mutation CreateTrainingMethod($input: CreateTrainingMethodInput!) {
    createTrainingMethod(input: $input) {
      id
      name
      slug
      description
    }
  }
`;

export const UPDATE_TRAINING_METHOD = gql`
  mutation UpdateTrainingMethod($id: Int!, $input: UpdateTrainingMethodInput!) {
    updateTrainingMethod(id: $id, input: $input) {
      id
      name
      slug
      description
    }
  }
`;

export const DELETE_TRAINING_METHOD = gql`
  mutation DeleteTrainingMethod($id: Int!) {
    deleteTrainingMethod(id: $id)
  }
`;

export const GET_BODY_PARTS_MINIMAL = gql`
  query GetBodyPartsMinimal {
    allBodyParts {
      id
      name
    }
  }
`;

export const ASSIGN_WORKOUT_TYPES_TO_CATEGORY = gql`
  mutation AssignWorkoutTypesToCategory(
    $categoryId: Int!
    $input: UpdateWorkoutCategoryInput!
  ) {
    updateWorkoutCategory(id: $categoryId, input: $input) {
      id
      name
      workoutTypes {
        id
        name
      }
    }
  }
`;

export const CREATE_WORKOUT_PLAN = gql`
  mutation CreateWorkoutPlan($input: CreateWorkoutPlanInput!) {
    createWorkoutPlan(input: $input) {
      id
      name
      version
      createdAt
    }
  }
`;

export const UPDATE_WORKOUT_PLAN = gql`
  mutation UpdateWorkoutPlan($id: Int!, $input: UpdateWorkoutPlanInput!) {
    updateWorkoutPlan(id: $id, input: $input) {
      id
      name
    }
  }
`;

export const DELETE_WORKOUT_PLAN = gql`
  mutation DeleteWorkoutPlan($id: Int!) {
    deleteWorkoutPlan(id: $id)
  }
`;
