import { useLazyQuery, useMutation } from '@apollo/client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { GET_ALL_EQUIPMENTS } from 'src/features/equipment/graphql/equipment.graphql';
import { Equipment } from 'src/features/equipment/types/equipment.types';
import Button from 'src/shared/components/Button';
import ButtonRow from 'src/shared/components/ButtonRow';
import FormInput from 'src/shared/components/FormInput';
import ModalWrapper from 'src/shared/components/ModalWrapper';
import SearchInput from 'src/shared/components/SearchInput';
import Title from 'src/shared/components/Title';
import { debounce } from 'src/shared/utils/helpers';

import EquipmentPickerList from './EquipmentPickerList';
import { ASSIGN_EQUIPMENT_TO_GYM } from '../graphql/gymEquipment';

export default function AddEquipmentToGymModal({
  visible,
  onClose,
  gymId,
  assignedEquipmentIds = [],
  onAssigned,
}: {
  visible: boolean;
  onClose: () => void;
  gymId: number;
  assignedEquipmentIds?: number[];
  onAssigned?: () => void; // ✅ new optional callback
}) {
  const [fetchEquipments, { data, loading }] = useLazyQuery(GET_ALL_EQUIPMENTS);
  const [assignEquipment] = useMutation(ASSIGN_EQUIPMENT_TO_GYM);

  const [search, setSearch] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) fetchEquipments();
  }, [visible, fetchEquipments]);

  const debouncedFetch = useMemo(
    () =>
      debounce((q: string) => {
        fetchEquipments({ variables: { search: q || undefined } });
      }, 500),
    [fetchEquipments],
  );

  useEffect(() => {
    debouncedFetch(search);
  }, [search, debouncedFetch]);

  const handleAssign = async (equipmentId: number, quantity: number, note?: string) => {
    try {
      await assignEquipment({
        variables: {
          input: {
            gymId,
            equipmentId,
            quantity,
            note,
          },
        },
      });
    } catch (error) {
      console.error('Failed to assign equipment to gym:', error);
    }
  };

  const { availableItems, assignedItems } = useMemo(() => {
    const available: Equipment[] = [];
    const assigned: Equipment[] = [];

    (data?.allEquipments ?? []).forEach((item: Equipment) => {
      if (assignedEquipmentIds.includes(item.id)) {
        assigned.push(item);
      } else {
        available.push(item);
      }
    });

    available.sort((a, b) => a.name.localeCompare(b.name));
    assigned.sort((a, b) => a.name.localeCompare(b.name));

    return { availableItems: available, assignedItems: assigned };
  }, [data, assignedEquipmentIds]);

  const handleSelect = useCallback((item: Equipment) => {
    setSelectedEquipment(item);
    setQuantity(1);
    setNote('');
  }, []);

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      {selectedEquipment ? (
        <>
          <Title text={`Add ${selectedEquipment.name}`} />
          <FormInput
            label="Quantity"
            value={String(quantity)}
            onChangeText={(val) => setQuantity(Number(val))}
            keyboardType="numeric"
          />
          <FormInput label="Note (optional)" value={note} onChangeText={setNote} />
          <ButtonRow>
            <Button text="Cancel" onPress={() => setSelectedEquipment(null)} fullWidth />
            <Button
              text="Confirm"
              fullWidth
              onPress={async () => {
                await handleAssign(selectedEquipment.id, quantity, note);
                setSelectedEquipment(null); // return to list
                setQuantity(1);
                setNote('');
                if (onAssigned) onAssigned();
              }}
            />
          </ButtonRow>
        </>
      ) : (
        <>
          <Title text="Add Equipment to Gym" />
          <SearchInput
            placeholder="Search from equipment..."
            value={search}
            onChange={setSearch}
            onClear={() => setSearch('')}
          />

          <EquipmentPickerList
            available={availableItems}
            assigned={assignedItems}
            loading={loading}
            onSelect={handleSelect}
          />

          <Button text="Close" onPress={onClose} />
        </>
      )}
    </ModalWrapper>
  );
}
