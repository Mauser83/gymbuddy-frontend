import { useQuery, useMutation } from '@apollo/client';

import {
  GET_MY_EXERCISES,
  CREATE_EXERCISE,
  UPDATE_EXERCISE,
  DELETE_EXERCISE,
} from '../graphql/exercise.graphql';
import { CreateExerciseInput, UpdateExerciseInput, Exercise } from '../types/exercise.types';

export function useExercise() {
  const useMyExercises = () => useQuery<{ getExercises: Exercise[] }>(GET_MY_EXERCISES);

  const [createExercise] = useMutation<
    { createExercise: Exercise },
    { input: CreateExerciseInput }
  >(CREATE_EXERCISE);
  const [updateExercise] = useMutation<
    { updateExercise: Exercise },
    { id: number; input: UpdateExerciseInput }
  >(UPDATE_EXERCISE);
  const [deleteExercise] = useMutation<{ deleteExercise: boolean }, { id: number }>(
    DELETE_EXERCISE,
  );

  return {
    useMyExercises,
    createExercise,
    updateExercise,
    deleteExercise,
  };
}
