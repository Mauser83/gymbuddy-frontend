import React from 'react';
import {useNavigate, useParams} from 'react-router-native';
import {useQuery, useMutation} from '@apollo/client';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import DetailField from 'shared/components/DetailField';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';
import Button from 'shared/components/Button';
import {
  GET_GYM_EQUIPMENT_DETAIL,
  REMOVE_GYM_EQUIPMENT,
} from 'features/gyms/graphql/gymEquipment';
import {GymEquipment} from 'features/gyms/types/gym.types';

export default function GymEquipmentDetailScreen() {
  const {gymId, gymEquipmentId} = useParams<{gymId: string; gymEquipmentId: string}>();
  const navigate = useNavigate();

  const {data, loading} = useQuery<{getGymEquipmentDetail: GymEquipment}>(
    GET_GYM_EQUIPMENT_DETAIL,
    {
      variables: {gymEquipmentId: Number(gymEquipmentId)},
    },
  );

  const [removeEquipment, {loading: removing}] = useMutation(REMOVE_GYM_EQUIPMENT);

  const equipment = data?.getGymEquipmentDetail;

  const handleRemove = async () => {
    try {
      await removeEquipment({variables: {gymEquipmentId: Number(gymEquipmentId)}});
      navigate(`/gym-admin/gyms/${gymId}/equipment`);
    } catch (error) {
      console.error('Failed to remove gym equipment:', error);
    }
  };

  return (
    <ScreenLayout scroll>
      <Title
        text={equipment?.equipment.name || 'Equipment Detail'}
      />
      {loading ? (
        <LoadingState text="Loading equipment..." />
      ) : !equipment ? (
        <NoResults message="Equipment not found." />
      ) : (
        <>
          <DetailField label="Brand" value={equipment.equipment.brand || 'N/A'} />
          <DetailField
            label="Category"
            value={equipment.equipment.category?.name || 'N/A'}
          />
          <DetailField
            label="Subcategory"
            value={equipment.equipment.subcategory?.name || 'N/A'}
          />
          <DetailField label="Quantity" value={String(equipment.quantity)} />
          {equipment.note ? (
            <DetailField label="Note" value={equipment.note} />
          ) : null}
          <Button
            text={removing ? 'Removing...' : 'Remove from Gym'}
            onPress={handleRemove}
            disabled={removing}
          />
        </>
      )}
    </ScreenLayout>
  );
}