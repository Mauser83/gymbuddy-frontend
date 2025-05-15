import React from 'react';
import { useNavigate, useParams } from 'react-router-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Button from 'shared/components/Button';
import ClickableList from 'shared/components/ClickableList';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';
import { useGymEquipment } from '../hooks/useGymEquipment';
import { GymEquipment } from 'modules/gym/types/gym.types'; // ✅ Use correct type

export default function GymEquipmentListScreen() {
  const { gymId } = useParams<{ gymId: string }>();
  const navigate = useNavigate();
  const {
    gymEquipment,
    loading,
    refetch,
    removeEquipment,
  } = useGymEquipment(Number(gymId));

  const handleRemove = async (gymEquipmentId: number) => {
    try {
      await removeEquipment({ variables: { gymEquipmentId } }); // ✅ updated variable
      refetch();
    } catch (error) {
      console.error('Failed to remove gym equipment:', error);
    }
  };

  const handleAdd = () => {
    navigate(`/gym/${gymId}/add-equipment`);
  };

  const equipmentItems = gymEquipment.map((item: GymEquipment) => ({
    id: item.id,
    label: `${item.equipment.name} (${item.quantity}x)`,
    subLabel: item.note || item.equipment.brand,
    onPress: () => {}, // could open a detail view later
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
