import { useQuery } from '@apollo/client';
import React, { useState, useMemo } from 'react';
import { ScrollView } from 'react-native';

import { GET_GYM_EQUIPMENT } from 'src/features/gyms/graphql/gymEquipment';
import { GymEquipment } from 'src/features/gyms/types/gym.types';
import ClickableList from 'src/shared/components/ClickableList';
import LoadingState from 'src/shared/components/LoadingState';
import NoResults from 'src/shared/components/NoResults';
import SearchInput from 'src/shared/components/SearchInput';
import Title from 'src/shared/components/Title';

interface EquipmentPickerModalProps {
  gymId: number;
  onClose: () => void;
  onSelect: (ge: GymEquipment) => void;
}

export default function EquipmentPickerModal({
  gymId,
  onClose,
  onSelect,
}: EquipmentPickerModalProps) {
  const [search, setSearch] = useState('');
  const { data, loading } = useQuery(GET_GYM_EQUIPMENT, { variables: { gymId } });

  const equipment = useMemo<GymEquipment[]>(() => data?.getGymEquipment ?? [], [data]);

  const filtered = useMemo(
    () => equipment.filter((ge) => ge.equipment.name.toLowerCase().includes(search.toLowerCase())),
    [equipment, search],
  );

  return (
    <>
      <Title text="Select Equipment" />
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search equipment"
        onClear={() => setSearch('')}
      />
      {loading ? (
        <LoadingState text="Loading equipment..." />
      ) : filtered.length === 0 ? (
        <NoResults message="No equipment found" />
      ) : (
        <ScrollView style={{ maxHeight: 500 }}>
          <ClickableList
            items={filtered.map((ge) => ({
              id: ge.id,
              label: ge.equipment.name,
              subLabel: ge.equipment.brand,
              onPress: () => {
                onSelect(ge);
                onClose();
              },
            }))}
          />
        </ScrollView>
      )}
    </>
  );
}
