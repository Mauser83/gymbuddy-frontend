import React, { useState, useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import ModalWrapper from '../../../../shared/components/ModalWrapper';
import SearchInput from '../../../../shared/components/SearchInput';
import ClickableList from '../../../../shared/components/ClickableList';
import NoResults from '../../../../shared/components/NoResults';
import { spacing } from '../../../../shared/theme/tokens';

interface Equipment {
  id: number;
  name: string;
  subcategoryId: number;
}

interface EquipmentPickerModalProps {
  visible: boolean;
  equipment: Equipment[];
  onClose: () => void;
  onSelect: (equipment: Equipment) => void;
}

const modalHeight = Dimensions.get('window').height * 0.8;

export default function EquipmentPickerModal({
  visible,
  equipment,
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

  const visibleEquipmentList = equipment.filter((eq: Equipment) =>
    eq.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <View style={{ padding: spacing.md, gap: spacing.md, height: modalHeight }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search equipment"
          onClear={() => setSearch('')}
        />

        {visibleEquipmentList.length === 0 ? (
          <NoResults message="No matching equipment found." />
        ) : (
          <ClickableList
            items={visibleEquipmentList.map((eq) => ({
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
