import {EquipmentSubcategory} from '../../equipment/types/equipment.types'; // assuming this exists
import {
  ExerciseType,
  ExerciseDifficulty,
  BodyPart,
  Muscle,
} from '../types/exercise.types';
import {useQuery} from '@apollo/client';
import {GET_REFERENCE_DATA} from '../graphql/exerciseReference.graphql';

interface ReferenceDataResponse {
  allExerciseTypes: ExerciseType[];
  allExerciseDifficulties: ExerciseDifficulty[];
  allBodyParts: (BodyPart & {muscles: Muscle[]})[];
  equipmentSubcategories: EquipmentSubcategory[]; // ✅ matches updated query
}

export function useReferenceData() {
  const {data, loading, error, refetch} =
    useQuery<ReferenceDataResponse>(GET_REFERENCE_DATA);

  const bodyParts: BodyPart[] = data?.allBodyParts || [];
  const muscles: Muscle[] = bodyParts.flatMap(bp => bp.muscles || []);
  const exerciseTypes = data?.allExerciseTypes || [];
  const difficulties = data?.allExerciseDifficulties || [];
  const equipmentSubcategories = data?.equipmentSubcategories || [];
  
  return {
    loading,
    error,
    bodyParts,
    muscles,
    exerciseTypes,
    difficulties,
    equipmentSubcategories, // NEW
    refetchAll: refetch,
  };
}
