import React, {useState} from 'react';
import {useNavigate, useParams} from 'react-router-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Button from 'shared/components/Button';
import ClickableList from 'shared/components/ClickableList';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';
import {useGymEquipment} from '../hooks/useGymEquipment';
import {GymEquipment} from 'modules/gym/types/gym.types'; // ✅ Use correct type
import AddEquipmentToGymModal from 'modules/gym/components/AddEquipmentToGymModal';

export default function GymEquipmentListScreen() {
  const {gymId} = useParams<{gymId: string}>();
  const navigate = useNavigate();
  const {gymEquipment, loading, refetch, removeEquipment} = useGymEquipment(
    Number(gymId),
  );
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);

  const handleRemove = async (gymEquipmentId: number) => {
    try {
      await removeEquipment({variables: {gymEquipmentId}}); // ✅ updated variable
      refetch();
    } catch (error) {
      console.error('Failed to remove gym equipment:', error);
    }
  };

const handleAssignComplete = () => {
  refetch();
};
  const equipmentItems = gymEquipment.map((item: GymEquipment) => ({
    id: item.id,
    label: `${item.equipment.name} (${item.quantity}x)`,
    subLabel: item.note || item.equipment.brand,
    onPress: () => {}, // could open a detail view later
    rightElement: (
      <Button text="Remove" onPress={() => handleRemove(item.id)} />
    ),
  }));

  return (
    <ScreenLayout scroll>
      <Title text="My Gym Equipment" subtitle="Manage equipment in your gym" />
      <Button
        text="Add Equipment from Catalog"
        onPress={() => setShowAddEquipmentModal(true)}
      />

      {loading ? (
        <LoadingState text="Loading gym equipment..." />
      ) : equipmentItems.length === 0 ? (
        <NoResults message="No equipment assigned to this gym." />
      ) : (
        <ClickableList items={equipmentItems} />
      )}

      <AddEquipmentToGymModal
        visible={showAddEquipmentModal}
        onClose={() => setShowAddEquipmentModal(false)}
        gymId={Number(gymId)}
        assignedEquipmentIds={gymEquipment.map(ge => ge.equipment.id)}
        onAssigned={handleAssignComplete}
      />
    </ScreenLayout>
  );
}
