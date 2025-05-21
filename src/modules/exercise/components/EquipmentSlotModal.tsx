import React, {useState, useEffect} from 'react';
import {ScrollView, Switch, View, TouchableOpacity} from 'react-native';
import ModalWrapper from 'shared/components/ModalWrapper';
import Title from 'shared/components/Title';
import FormInput from 'shared/components/FormInput';
import ClickableList from 'shared/components/ClickableList';
import Button from 'shared/components/Button';
import DividerWithLabel from 'shared/components/DividerWithLabel';
import SearchInput from 'shared/components/SearchInput';
import Toast from 'react-native-toast-message';
import {EquipmentSubcategory} from 'modules/equipment/types/equipment.types';

interface EquipmentSlotModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (slot: {
    isRequired: boolean;
    comment?: string;
    options: {subcategoryId: number}[];
  }) => void;
  initialSlotIndex: number;
  subcategories: EquipmentSubcategory[];
  initialData?: {
    isRequired: boolean;
    comment?: string;
    options: {subcategoryId: number}[];
  };
}

export default function EquipmentSlotModal({
  visible,
  onClose,
  onSave,
  initialSlotIndex,
  subcategories,
  initialData,
}: EquipmentSlotModalProps) {
  const [isRequired, setIsRequired] = useState(initialData?.isRequired ?? true);
  const [comment, setComment] = useState<string>(initialData?.comment || '');
  const [selectedSubIds, setSelectedSubIds] = useState<number[]>(
    initialData?.options.map(opt => opt.subcategoryId) || [],
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (!visible) {
      setSelectedSubIds([]);
      setComment('');
      setIsRequired(true);
      setSearchQuery('');
    }
  }, [visible]);

  const toggleSubcategory = (id: number) => {
    setSelectedSubIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id],
    );
  };

  const handleSave = () => {
    if (selectedSubIds.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Please select at least one equipment option.',
      });
      return;
    }

    onSave({
      isRequired,
      comment: comment || undefined,
      options: selectedSubIds.map(id => ({subcategoryId: id})),
    });

    onClose();
  };

  const grouped = subcategories.reduce(
    (acc, sc) => {
      const key = sc.category?.name || 'Other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(sc);
      return acc;
    },
    {} as Record<string, EquipmentSubcategory[]>,
  );

  const filteredGroupKeys = Object.keys(grouped);

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <ScrollView contentContainerStyle={{padding: 16}}>
        <Title
          text={`Equipment Slot ${initialSlotIndex + 1}`}
          subtitle="Configure equipment requirements"
        />

        <View style={{marginVertical: 12}}>
          <FormInput
            label="Comment (optional)"
            value={comment}
            onChangeText={setComment}
            placeholder="e.g., Any barbell or cable machine"
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Title text="Required?" />
          <Switch value={isRequired} onValueChange={setIsRequired} />
        </View>

        <DividerWithLabel label="Equipment Options" />

        <SearchInput
          placeholder="Search equipment..."
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />

        {filteredGroupKeys.map(category => {
          const items = grouped[category].filter(
            sc =>
              sc.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
              !selectedSubIds.includes(sc.id),
          );

          if (items.length === 0) return null;

          const isExpanded = expandedCategories.has(category);
          const showAll = isExpanded || searchQuery.length > 0;

          return (
            <View key={category} style={{marginBottom: 16}}>
              <TouchableOpacity
                onPress={() => {
                  const next = new Set(expandedCategories);
                  if (next.has(category)) {
                    next.delete(category);
                  } else {
                    next.add(category);
                  }
                  setExpandedCategories(next);
                }}>
                <Title text={`${category} (${items.length})`} />
              </TouchableOpacity>
              {showAll && (
                <ClickableList
                  items={items.map(sc => ({
                    id: sc.id,
                    label: sc.name,
                    selected: selectedSubIds.includes(sc.id),
                    onPress: () => toggleSubcategory(sc.id),
                  }))}
                />
              )}
            </View>
          );
        })}

        {selectedSubIds.length > 0 && (
          <>
            <DividerWithLabel label="Selected" />
            <ClickableList
              items={subcategories
                .filter(sc => selectedSubIds.includes(sc.id))
                .map(sc => ({
                  id: sc.id,
                  label: `${sc.name} (${sc.category?.name || 'Other'})`,
                  selected: true,
                  onPress: () => toggleSubcategory(sc.id),
                }))}
            />
          </>
        )}

        {selectedSubIds.length === 0 && (
          <Title subtitle="Please select at least one equipment option." />
        )}

        <View style={{marginTop: 24}}>
          <Button text="Save Slot" onPress={handleSave} />
        </View>
      </ScrollView>
    </ModalWrapper>
  );
}
