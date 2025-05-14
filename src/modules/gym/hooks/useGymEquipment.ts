// Shared GraphQL Hook Example: useGymEquipment.js
import {
  GET_GYM_EQUIPMENT,
  ASSIGN_EQUIPMENT_TO_GYM,
  REMOVE_EQUIPMENT_FROM_GYM,
  GET_GYM_EQUIPMENT_STATS,
} from '../graphql/gymEquipment';
import { useQuery, useMutation } from '@apollo/client';

export function useGymEquipment(gymId: number) {
  const { data, loading, refetch } = useQuery(GET_GYM_EQUIPMENT, {
    variables: { gymId },
  });
  const [assignEquipment] = useMutation(ASSIGN_EQUIPMENT_TO_GYM);
  const [removeEquipment] = useMutation(REMOVE_EQUIPMENT_FROM_GYM);

  const equipmentStats = useQuery(GET_GYM_EQUIPMENT_STATS, {
    variables: { gymId },
  });

  return {
    gymEquipment: data?.gymEquipment || [],
    loading,
    refetch,
    assignEquipment,
    removeEquipment,
    equipmentStats,
  };
}