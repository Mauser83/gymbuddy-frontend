import React, { useState, useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import { useQuery } from '@apollo/client';
import ModalWrapper from '../../../../shared/components/ModalWrapper';
import SearchInput from '../../../../shared/components/SearchInput';
import ClickableList from '../../../../shared/components/ClickableList';
import NoResults from '../../../../shared/components/NoResults';
import { GET_GYM_EQUIPMENT } from '../graphql/userWorkouts.graphql';
import { spacing } from '../../../../shared/theme/tokens';

interface Equipment {
  id: number;
  name: string;
  subcategoryId: number;
}

interface EquipmentPickerModalProps {
  visible: boolean;
  gymId: number | null;
  requiredSubcategoryIds: number[];
  onClose: () => void;
  onSelect: (equipment: Equipment) => void;
}

const modalHeight = Dimensions.get('window').height * 0.8;

export default function EquipmentPickerModal({
  visible,
  gymId,
  requiredSubcategoryIds,
  onClose,
  onSelect,
}: EquipmentPickerModalProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data, loading } = useQuery(GET_GYM_EQUIPMENT, {
    variables: { gymId },
    skip: !gymId,
  });

  const equipmentList: Equipment[] = (data?.gymEquipmentByGymId ?? [])
    .map((entry: any) => {
      const subcategoryId = entry?.equipment?.subcategory?.id;
      return subcategoryId
        ? {
            id: entry.id,
            name: entry.equipment.name,
            subcategoryId,
          }
        : null;
    })
    .filter((eq: Equipment): eq is Equipment => !!eq)
    .filter((eq: Equipment) => requiredSubcategoryIds.includes(eq.subcategoryId))
    .filter((eq: Equipment) => eq.name.toLowerCase().includes(debouncedSearch.toLowerCase()));

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <View style={{ padding: spacing.md, gap: spacing.md, height: modalHeight }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search equipment"
          onClear={() => setSearch('')}
        />

        {!loading && equipmentList.length === 0 ? (
          <NoResults message="No matching equipment found." />
        ) : (
          <ClickableList
            items={equipmentList.map((eq) => ({
              id: String(eq.id),
              label: eq.name,
              onPress: () => {
                onSelect(eq);
                onClose();
              },
            }))}
          />
        )}
      </View>
    </ModalWrapper>
  );
}
