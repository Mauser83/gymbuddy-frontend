import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ALL_EQUIPMENTS, ASSIGN_EQUIPMENT_TO_GYM } from '@/graphql/gymEquipment';
import { useGymContext } from '@/hooks/useGymContext';
import { ModalWrapper } from '@/components/ui/ModalWrapper';
import { Title } from '@/components/ui/Title';
import { SearchInput } from '@/components/ui/SearchInput';
import { ClickableList } from '@/components/ui/ClickableList';
import { LoadingState } from '@/components/ui/LoadingState';
import { NoResults } from '@/components/ui/NoResults';
import { Button } from '@/components/ui/Button';

export default function AddEquipmentToGymModal({ visible, onClose }) {
  const { gymId } = useGymContext();
  const { data, loading, refetch } = useQuery(GET_ALL_EQUIPMENTS);
  const [assignEquipment] = useMutation(ASSIGN_EQUIPMENT_TO_GYM);
  const [search, setSearch] = useState('');

  const handleAssign = async (equipmentId) => {
    try {
      await assignEquipment({ variables: { gymId, equipmentId } });
      onClose();
    } catch (error) {
      console.error('Failed to assign equipment to gym:', error);
    }
  };

  const filteredItems = (data?.allEquipments ?? []).filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  ).map((item) => ({
    id: item.id,
    label: item.name,
    subLabel: `${item.brand} \u2022 ${item.category?.name}`,
    onPress: () => handleAssign(item.id),
  }));

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <Title text="Add Equipment to Gym" />
      <SearchInput
        value={search}
        onChange={(val) => setSearch(val)}
        placeholder="Search global equipment..."
      />

      {loading ? (
        <LoadingState text="Loading catalog..." />
      ) : filteredItems.length === 0 ? (
        <NoResults message="No equipment found in catalog." />
      ) : (
        <ClickableList items={filteredItems} />
      )}

      <Button text="Close" onPress={onClose} variant="outline" />
    </ModalWrapper>
  );
}
