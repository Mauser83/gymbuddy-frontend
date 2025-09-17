import { useQuery } from '@apollo/client';

import { EquipmentSubcategory } from 'src/features/equipment/types/equipment.types'; // assuming this exists

import { GET_REFERENCE_DATA } from '../graphql/exerciseReference.graphql';
import {
  ExerciseType,
  ExerciseDifficulty,
  BodyPart,
  Muscle,
  Metric,
} from '../types/exercise.types';

interface ReferenceDataResponse {
  allExerciseTypes: ExerciseType[];
  allExerciseDifficulties: ExerciseDifficulty[];
  allBodyParts: (BodyPart & { muscles: Muscle[] })[];
  equipmentSubcategories: EquipmentSubcategory[]; // ✅ matches updated query
  allMetrics: Metric[]; // ✅ New
}

export function useReferenceData() {
  const { data, loading, error, refetch } = useQuery<ReferenceDataResponse>(GET_REFERENCE_DATA);

  const bodyParts: BodyPart[] = data?.allBodyParts || [];
  const muscles: Muscle[] = bodyParts.flatMap((bp) => bp.muscles || []);
  const exerciseTypes = data?.allExerciseTypes || [];
  const difficulties = data?.allExerciseDifficulties || [];
  const equipmentSubcategories = data?.equipmentSubcategories || [];
  const metrics = data?.allMetrics || [];

  return {
    loading,
    error,
    bodyParts,
    muscles,
    exerciseTypes,
    difficulties,
    equipmentSubcategories, // NEW
    metrics, // ✅ New
    refetchAll: refetch,
  };
}
