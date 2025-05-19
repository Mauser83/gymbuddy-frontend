import { useQuery } from '@apollo/client';
import { GET_REFERENCE_DATA } from '../graphql/exerciseReference.graphql';
import {
  ExerciseType,
  ExerciseDifficulty,
  Muscle,
  BodyPart,
} from '../types/exercise.types';

interface ReferenceDataResponse {
  allExerciseTypes: ExerciseType[];
  allExerciseDifficulties: ExerciseDifficulty[];
  allBodyParts: (BodyPart & { muscles: Muscle[] })[];
}

export function useReferenceData() {
  const { data, loading, error, refetch } = useQuery<ReferenceDataResponse>(GET_REFERENCE_DATA);

  const bodyParts: BodyPart[] = data?.allBodyParts || [];
  const muscles: Muscle[] = bodyParts.flatMap(bp => bp.muscles || []);
  const exerciseTypes = data?.allExerciseTypes || [];
  const difficulties = data?.allExerciseDifficulties || [];

  return {
    loading,
    error,
    bodyParts,
    muscles,
    exerciseTypes,
    difficulties,
    refetchAll: refetch,
  };
}
