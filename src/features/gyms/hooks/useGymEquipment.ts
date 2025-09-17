import { useQuery, useMutation } from '@apollo/client';

import { AssignEquipmentToGymInput, GymEquipment } from 'src/features/gyms/types/gym.types';

import {
  GET_GYM_EQUIPMENT,
  ASSIGN_EQUIPMENT_TO_GYM,
  REMOVE_GYM_EQUIPMENT,
  // GET_GYM_EQUIPMENT_STATS,
} from '../graphql/gymEquipment';

export function useGymEquipment(gymId: number) {
  const { data, loading, refetch } = useQuery<{ getGymEquipment: GymEquipment[] }>(
    GET_GYM_EQUIPMENT,
    {
      variables: { gymId },
    },
  );

  const [assignEquipment] = useMutation<
    { assignEquipmentToGym: GymEquipment },
    { input: AssignEquipmentToGymInput }
  >(ASSIGN_EQUIPMENT_TO_GYM);

  const [removeEquipment] = useMutation<
    { removeGymEquipment: boolean },
    { gymEquipmentId: number }
  >(REMOVE_GYM_EQUIPMENT);

  // const equipmentStats = useQuery(GET_GYM_EQUIPMENT_STATS, {
  //   variables: { gymId },
  //   skip: !gymId,
  // });

  return {
    gymEquipment: data?.getGymEquipment || [],
    loading,
    refetch,
    assignEquipment,
    removeEquipment,
    // equipmentStats,
  };
}
