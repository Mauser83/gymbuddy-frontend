import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_GYM_EQUIPMENT, REMOVE_EQUIPMENT_FROM_GYM } from '@/graphql/gymEquipment';
import { useGymContext } from '@/hooks/useGymContext';
import { ScreenLayout } from '@/components/layouts/ScreenLayout';
import { Title } from '@/components/ui/Title';
import { Button } from '@/components/ui/Button';
import { ClickableList } from '@/components/ui/ClickableList';
import { LoadingState } from '@/components/ui/LoadingState';
import { NoResults } from '@/components/ui/NoResults';
import { useNavigation } from '@react-navigation/native';

export default function GymEquipmentListScreen() {
  const { gymId } = useGymContext();
  const navigation = useNavigation();
  const { data, loading, refetch } = useQuery(GET_GYM_EQUIPMENT, {
    variables: { gymId },
  });
  const [removeEquipment] = useMutation(REMOVE_EQUIPMENT_FROM_GYM);

  const handleRemove = async (equipmentId) => {
    try {
      await removeEquipment({ variables: { gymId, equipmentId } });
      refetch();
    } catch (error) {
      console.error('Failed to remove equipment from gym:', error);
    }
  };

  const handleAdd = () => {
    navigation.navigate('AddEquipmentToGym');
  };

  const equipmentItems = data?.gymEquipment?.map((item) => ({
    id: item.id,
    label: item.name,
    subLabel: `${item.brand} \u2022 ${item.category?.name}`,
    onPress: () => {},
    rightElement: (
      <Button
        text="Remove"
        onPress={() => handleRemove(item.id)}
        variant="outline"
      />
    ),
  })) ?? [];

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
