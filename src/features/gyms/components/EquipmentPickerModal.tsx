import React, {useState, useMemo} from 'react';
import {useQuery} from '@apollo/client';
import {ScrollView} from 'react-native';

import Title from 'shared/components/Title';
import SearchInput from 'shared/components/SearchInput';
import ClickableList from 'shared/components/ClickableList';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';
import {GET_GYM_EQUIPMENT} from 'features/gyms/graphql/gymEquipment';
import {GymEquipment} from 'features/gyms/types/gym.types';

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
  const {data, loading} = useQuery(GET_GYM_EQUIPMENT, {variables: {gymId}});

  const equipment = useMemo<GymEquipment[]>(
    () => data?.getGymEquipment ?? [],
    [data],
  );

  const filtered = useMemo(
    () =>
      equipment.filter(ge =>
        ge.equipment.name.toLowerCase().includes(search.toLowerCase()),
      ),
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
        <ScrollView style={{maxHeight: 500}}>
          <ClickableList
            items={filtered.map(ge => ({
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
