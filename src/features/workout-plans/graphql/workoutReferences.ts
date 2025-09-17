import { gql } from '@apollo/client';

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

export const CREATE_TRAINING_GOAL = gql`
  mutation CreateTrainingGoal($input: TrainingGoalInput!) {
    createTrainingGoal(input: $input) {
      id
      name
      slug
    }
  }
`;

export const UPDATE_TRAINING_GOAL = gql`
  mutation UpdateTrainingGoal($id: Int!, $input: TrainingGoalInput!) {
    updateTrainingGoal(id: $id, input: $input) {
      id
      name
      slug
    }
  }
`;

export const DELETE_TRAINING_GOAL = gql`
  mutation DeleteTrainingGoal($id: Int!) {
    deleteTrainingGoal(id: $id)
  }
`;

export const CREATE_INTENSITY_PRESET = gql`
  mutation CreateIntensityPreset($input: IntensityPresetInput!) {
    createIntensityPreset(input: $input) {
      id
      trainingGoalId
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
    }
  }
`;

export const UPDATE_INTENSITY_PRESET = gql`
  mutation UpdateIntensityPreset($id: Int!, $input: IntensityPresetInput!) {
    updateIntensityPreset(id: $id, input: $input) {
      id
      trainingGoalId
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
    }
  }
`;

export const DELETE_INTENSITY_PRESET = gql`
  mutation DeleteIntensityPreset($id: Int!) {
    deleteIntensityPreset(id: $id)
  }
`;

export const CREATE_EXPERIENCE_LEVEL = gql`
  mutation CreateExperienceLevel($input: CreateExperienceLevelInput!) {
    createExperienceLevel(input: $input) {
      id
      name
      key
      isDefault
    }
  }
`;

export const UPDATE_EXPERIENCE_LEVEL = gql`
  mutation UpdateExperienceLevel($id: Int!, $input: UpdateExperienceLevelInput!) {
    updateExperienceLevel(id: $id, input: $input) {
      id
      name
      key
      isDefault
    }
  }
`;

export const DELETE_EXPERIENCE_LEVEL = gql`
  mutation DeleteExperienceLevel($id: Int!) {
    deleteExperienceLevel(id: $id)
  }
`;

export const UPDATE_TRAINING_METHOD_GOALS = gql`
  mutation UPDATE_TRAINING_METHOD_GOALS($input: UpdateTrainingMethodGoalsInput!) {
    updateTrainingMethodGoals(input: $input) {
      id
      name
      trainingGoals {
        id
        name
      }
    }
  }
`;
