import React, { useState, useEffect } from 'react';
import { View } from 'react-native';

import Button from 'src/shared/components/Button';
import ClickableList from 'src/shared/components/ClickableList';
import ModalWrapper from 'src/shared/components/ModalWrapper';
import NoResults from 'src/shared/components/NoResults';
import Title from 'src/shared/components/Title';
import { spacing } from 'src/shared/theme/tokens';

interface EquipmentOption {
  id: number;
  name: string;
  subcategoryId: number;
}

interface EquipmentSlot {
  subcategoryName: string;
  subcategoryIds: number[];
}

interface Props {
  visible: boolean;
  requiredSlots: EquipmentSlot[];
  equipment: EquipmentOption[];
  defaultSelectedEquipmentIds?: number[];

  onClose: () => void;
  onSelect: (equipmentIds: number[]) => void;
}

export default function MultiSlotEquipmentPickerModal({
  visible,
  requiredSlots,
  equipment,
  defaultSelectedEquipmentIds,
  onClose,
  onSelect,
}: Props) {
  const [selected, setSelected] = useState<Record<number, number | null>>({});

  const handlePick = (slotIndex: number, eqId: number) => {
    setSelected((prev) => ({ ...prev, [slotIndex]: eqId }));
  };

  const allSelected = requiredSlots.every((_, i) => selected[i] != null);

  const handleConfirm = () => {
    if (allSelected) {
      onSelect(Object.values(selected) as number[]);
    }
  };

  useEffect(() => {
    if (visible) {
      const initial: Record<number, number | null> = {};
      requiredSlots.forEach((slot, index) => {
        const prefillId = defaultSelectedEquipmentIds?.[index] ?? null;
        initial[index] = prefillId;
      });
      setSelected(initial);
    }
  }, [visible, requiredSlots, defaultSelectedEquipmentIds]);

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <View style={{ padding: spacing.md, gap: spacing.lg }}>
        {requiredSlots.map((slot, index) => {
          const options = equipment.filter((eq) => slot.subcategoryIds.includes(eq.subcategoryId));

          return (
            <View key={index} style={{ gap: spacing.sm }}>
              <Title subtitle={`Select ${slot.subcategoryName}`} />
              {options.length === 0 ? (
                <NoResults message={`No available equipment for ${slot.subcategoryName}`} />
              ) : (
                <ClickableList
                  items={options.map((eq) => ({
                    id: eq.id,
                    label: eq.name,
                    onPress: () => handlePick(index, eq.id),
                    selected: selected[index] === eq.id,
                  }))}
                />
              )}
            </View>
          );
        })}

        <Button text="Confirm Selection" onPress={handleConfirm} disabled={!allSelected} />
      </View>
    </ModalWrapper>
  );
}
