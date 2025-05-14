import React from 'react';
import { useNavigate, useParams } from 'react-router-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Button from 'shared/components/Button';
import ClickableList from 'shared/components/ClickableList';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';
import { useGymEquipment } from '../hooks/useGymEquipment';
import { Equipment } from 'modules/equipment/types/equipment.types';

export default function GymEquipmentListScreen() {
  const { gymId } = useParams<{ gymId: string }>();
  const navigate = useNavigate();
  const {
    gymEquipment,
    loading,
    refetch,
    removeEquipment,
  } = useGymEquipment(Number(gymId));

  const handleRemove = async (equipmentId: number) => {
    try {
      await removeEquipment({ variables: { gymId: Number(gymId), equipmentId } });
      refetch();
    } catch (error) {
      console.error('Failed to remove equipment from gym:', error);
    }
  };

  const handleAdd = () => {
    navigate('/gym/' + gymId + '/add-equipment');
  };

  const equipmentItems = gymEquipment.map((item: Equipment) => ({
    id: item.id,
    label: item.name,
    subLabel: `${item.brand}`,
    onPress: () => {},
    rightElement: (
      <Button
        text="Remove"
        onPress={() => handleRemove(item.id)}
        variant="outline"
      />
    ),
  }));

  return (
    <ScreenLayout scroll>
      <Title text="My Gym Equipment" subtitle="Manage equipment in your gym" />
      <Button text="Add Equipment from Catalog" onPress={handleAdd} />

      {loading ? (
        <LoadingState text="Loading gym equipment..." />
      ) : equipmentItems.length === 0 ? (
        <NoResults message="No equipment assigned to this gym." />
      ) : (
        <ClickableList items={equipmentItems} />
      )}
    </ScreenLayout>
  );
}
