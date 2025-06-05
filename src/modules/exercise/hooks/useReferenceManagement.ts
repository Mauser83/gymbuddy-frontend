import { useQuery, useMutation } from '@apollo/client';
import {
  GET_EXERCISE_TYPES,
  CREATE_EXERCISE_TYPE,
  UPDATE_EXERCISE_TYPE,
  DELETE_EXERCISE_TYPE,
  GET_EXERCISE_DIFFICULTIES,
  CREATE_EXERCISE_DIFFICULTY,
  UPDATE_EXERCISE_DIFFICULTY,
  DELETE_EXERCISE_DIFFICULTY,
  GET_BODY_PARTS,
  CREATE_BODY_PART,
  UPDATE_BODY_PART,
  DELETE_BODY_PART,
  GET_MUSCLES_BY_BODY_PART,
  CREATE_MUSCLE,
  UPDATE_MUSCLE,
  DELETE_MUSCLE,
  GET_METRICS,
  CREATE_METRIC,
  UPDATE_METRIC,
  DELETE_METRIC,
} from '../graphql/exerciseReference.graphql';

export type Mode = 'type' | 'difficulty' | 'bodyPart' | 'muscle' | 'metric';

export type CreateMetricInput = {
  name: string;
  slug: string;
  unit: string;
  inputType: string;
};

export type CreateExerciseTypeInput = {
  name: string;
  metricIds: number[];
};

export function useReferenceManagement(mode: Mode, bodyPartId?: number) {
  // Queries
  const typeQuery = useQuery(GET_EXERCISE_TYPES);
  const difficultyQuery = useQuery(GET_EXERCISE_DIFFICULTIES);
  const bodyPartQuery = useQuery(GET_BODY_PARTS);
  const muscleQuery = useQuery(GET_MUSCLES_BY_BODY_PART, {
    skip: !bodyPartId,
    variables: { bodyPartId },
  });
  const metricQuery = useQuery(GET_METRICS);

  // Mutations
  const [createType] = useMutation(CREATE_EXERCISE_TYPE);
  const [updateType] = useMutation(UPDATE_EXERCISE_TYPE);
  const [deleteType] = useMutation(DELETE_EXERCISE_TYPE);

  const [createDifficulty] = useMutation(CREATE_EXERCISE_DIFFICULTY);
  const [updateDifficulty] = useMutation(UPDATE_EXERCISE_DIFFICULTY);
  const [deleteDifficulty] = useMutation(DELETE_EXERCISE_DIFFICULTY);

  const [createBodyPart] = useMutation(CREATE_BODY_PART);
  const [updateBodyPart] = useMutation(UPDATE_BODY_PART);
  const [deleteBodyPart] = useMutation(DELETE_BODY_PART);

  const [createMuscle] = useMutation(CREATE_MUSCLE);
  const [updateMuscle] = useMutation(UPDATE_MUSCLE);
  const [deleteMuscle] = useMutation(DELETE_MUSCLE);

  const [createMetric] = useMutation(CREATE_METRIC);
  const [updateMetric] = useMutation(UPDATE_METRIC);
  const [deleteMetric] = useMutation(DELETE_METRIC);

  // Unified interface
  switch (mode) {
    case 'type':
      return {
        data: typeQuery.data?.allExerciseTypes,
        refetch: typeQuery.refetch,
        createItem: (input: CreateExerciseTypeInput) =>
          createType({ variables: { input } }),
        updateItem: (id: number, input: CreateExerciseTypeInput) =>
          updateType({ variables: { id, input } }),
        deleteItem: (id: number) => deleteType({ variables: { id } }),
      } as const;

    case 'difficulty':
      return {
        data: difficultyQuery.data?.allExerciseDifficulties,
        refetch: difficultyQuery.refetch,
        createItem: (level: string) =>
          createDifficulty({ variables: { input: { level } } }),
        updateItem: (id: number, level: string) =>
          updateDifficulty({ variables: { id, input: { level } } }),
        deleteItem: (id: number) => deleteDifficulty({ variables: { id } }),
      };

    case 'bodyPart':
      return {
        data: bodyPartQuery.data?.allBodyParts,
        refetch: bodyPartQuery.refetch,
        createItem: (name: string) =>
          createBodyPart({ variables: { input: { name } } }),
        updateItem: (id: number, name: string) =>
          updateBodyPart({ variables: { id, input: { name } } }),
        deleteItem: (id: number) => deleteBodyPart({ variables: { id } }),
      };

    case 'muscle':
      return {
        data: muscleQuery.data?.musclesByBodyPart,
        refetch: muscleQuery.refetch,
        createItem: (name: string) => {
          if (!bodyPartId) throw new Error('Missing bodyPartId for muscle');
          return createMuscle({ variables: { input: { name, bodyPartId } } });
        },
        updateItem: (id: number, name: string) => {
          if (!bodyPartId) throw new Error('Missing bodyPartId for muscle');
          return updateMuscle({ variables: { id, input: { name, bodyPartId } } });
        },
        deleteItem: (id: number) => deleteMuscle({ variables: { id } }),
      };

    case 'metric':
      return {
        data: metricQuery.data?.allMetrics,
        refetch: metricQuery.refetch,
        createItem: (input: CreateMetricInput) =>
          createMetric({ variables: { input } }),
        updateItem: (id: number, input: Partial<CreateMetricInput>) =>
          updateMetric({ variables: { id, input } }),
        deleteItem: (id: number) => deleteMetric({ variables: { id } }),
      } as const;

    default:
      throw new Error(`Unsupported mode: ${mode}`);
  }
}
