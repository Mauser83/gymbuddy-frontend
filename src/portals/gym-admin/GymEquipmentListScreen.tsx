import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-native';

import AddEquipmentToGymModal from 'src/features/gyms/components/AddEquipmentToGymModal';
import { useGymEquipment } from 'src/features/gyms/hooks/useGymEquipment';
import { GymEquipment } from 'src/features/gyms/types/gym.types'; // ✅ Use correct type
import Button from 'src/shared/components/Button';
import ClickableList from 'src/shared/components/ClickableList';
import LoadingState from 'src/shared/components/LoadingState';
import NoResults from 'src/shared/components/NoResults';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import Title from 'src/shared/components/Title';

export default function GymEquipmentListScreen() {
  const { gymId } = useParams<{ gymId: string }>();
  const navigate = useNavigate();
  const { gymEquipment, loading, refetch } = useGymEquipment(Number(gymId));
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const handleAssignComplete = () => {
    refetch();
  };
  const equipmentItems = [...gymEquipment]
    .sort((a, b) => a.equipment.name.localeCompare(b.equipment.name))
    .map((item: GymEquipment) => ({
      id: item.id,
      label: `${item.equipment.name} (${item.quantity}x)`,
      subLabel: item.note || item.equipment.brand,
      onPress: () => navigate(`/gym-admin/gyms/${gymId}/equipment/${item.id}`),
    }));

  return (
    <ScreenLayout scroll>
      <Title text="My Gym Equipment" subtitle="Manage equipment in your gym" />
      <Button text="Add Equipment from Catalog" onPress={() => setShowAddEquipmentModal(true)} />

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
        assignedEquipmentIds={gymEquipment.map((ge) => ge.equipment.id)}
        onAssigned={handleAssignComplete}
      />
    </ScreenLayout>
  );
}
