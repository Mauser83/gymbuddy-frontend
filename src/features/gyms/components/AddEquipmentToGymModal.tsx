import React, {useState} from 'react';
import {useQuery} from '@apollo/client';
import {GET_ALL_EQUIPMENTS} from 'features/equipment/graphql/equipment.graphql';
import {ASSIGN_EQUIPMENT_TO_GYM} from '../graphql/gymEquipment';
import ModalWrapper from 'shared/components/ModalWrapper';
import Title from 'shared/components/Title';
import SearchInput from 'shared/components/SearchInput';
import ClickableList from 'shared/components/ClickableList';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';
import Button from 'shared/components/Button';
import {useMutation} from '@apollo/client';
import {Equipment} from 'features/equipment/types/equipment.types';
import FormInput from 'shared/components/FormInput';
import {Text} from 'react-native';
import ButtonRow from 'shared/components/ButtonRow';
import DividerWithLabel from 'shared/components/DividerWithLabel';

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
  const {data, loading} = useQuery(GET_ALL_EQUIPMENTS, {
    fetchPolicy: 'cache-and-network',
  });

  const [assignEquipment] = useMutation(ASSIGN_EQUIPMENT_TO_GYM);
  const [search, setSearch] = useState('');

  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  const handleAssign = async (
    equipmentId: number,
    quantity: number,
    note?: string,
  ) => {
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

  const availableItems: Equipment[] = [];
  const assignedItems: Equipment[] = [];

  const query = search.toLowerCase();

  (data?.allEquipments ?? [])
    .filter((item: Equipment) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query) ||
        item.category?.name?.toLowerCase().includes(query) ||
        item.subcategory?.name?.toLowerCase().includes(query)
      );
    })
    .forEach((item: Equipment) => {
      if (assignedEquipmentIds.includes(item.id)) {
        assignedItems.push(item);
      } else {
        availableItems.push(item);
      }
    });

  availableItems.sort((a, b) => a.name.localeCompare(b.name));
  assignedItems.sort((a, b) => a.name.localeCompare(b.name));

  const toListItem = (item: Equipment, isAssigned: boolean) => ({
    id: item.id,
    label: item.name,
    subLabel: `${item.brand}`,
    disabled: isAssigned,
    onPress: isAssigned
      ? undefined
      : () => {
          setSelectedEquipment(item);
          setQuantity(1);
          setNote('');
        },
    rightElement: isAssigned ? (
      <Text style={{color: 'gray'}}>✓ Added</Text>
    ) : undefined,
  });

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      {selectedEquipment ? (
        <>
          <Title text={`Add ${selectedEquipment.name}`} />
          <FormInput
            label="Quantity"
            value={String(quantity)}
            onChangeText={val => setQuantity(Number(val))}
            keyboardType="numeric"
          />
          <FormInput
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
          />
          <ButtonRow>
            <Button
              text="Cancel"
              onPress={() => setSelectedEquipment(null)}
              fullWidth
            />
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

          {loading ? (
            <LoadingState text="Loading catalog..." />
          ) : availableItems.length === 0 && assignedItems.length === 0 ? (
            <NoResults message="No equipment found in catalog." />
          ) : (
            <>
              <ClickableList
                items={availableItems.map(item => toListItem(item, false))}
              />
              {assignedItems.length > 0 && (
                <>
                  <DividerWithLabel label="Already Added" />
                  <ClickableList
                    items={assignedItems.map(item => toListItem(item, true))}
                  />
                </>
              )}
            </>
          )}

          <Button text="Close" onPress={onClose} />
        </>
      )}
    </ModalWrapper>
  );
}
