import React, { memo } from 'react';
import { ScrollView, Text } from 'react-native';

import { Equipment } from 'src/features/equipment/types/equipment.types';
import ClickableList from 'src/shared/components/ClickableList';
import DividerWithLabel from 'src/shared/components/DividerWithLabel';
import LoadingState from 'src/shared/components/LoadingState';
import NoResults from 'src/shared/components/NoResults';

interface EquipmentPickerListProps {
  available: Equipment[];
  assigned: Equipment[];
  loading: boolean;
  onSelect: (equipment: Equipment) => void;
}

const EquipmentPickerListComponent = ({
  available,
  assigned,
  loading,
  onSelect,
}: EquipmentPickerListProps) => {
  const toListItem = (item: Equipment, isAssigned: boolean) => ({
    id: item.id,
    label: item.name,
    subLabel: `${item.brand}`,
    disabled: isAssigned,
    onPress: isAssigned ? undefined : () => onSelect(item),
    rightElement: isAssigned ? <Text style={{ color: 'gray' }}>✓ Added</Text> : undefined,
  });

  return (
    <ScrollView style={{ height: 500 }}>
      {loading && available.length === 0 && assigned.length === 0 ? (
        <LoadingState text="Loading catalog..." />
      ) : available.length === 0 && assigned.length === 0 ? (
        <NoResults message="No equipment found in catalog." />
      ) : (
        <>
          <ClickableList items={available.map((item) => toListItem(item, false))} />
          {assigned.length > 0 && (
            <>
              <DividerWithLabel label="Already Added" />
              <ClickableList items={assigned.map((item) => toListItem(item, true))} />
            </>
          )}
        </>
      )}
    </ScrollView>
  );
};

EquipmentPickerListComponent.displayName = 'EquipmentPickerList';

const EquipmentPickerList = memo(EquipmentPickerListComponent);

export default EquipmentPickerList;
