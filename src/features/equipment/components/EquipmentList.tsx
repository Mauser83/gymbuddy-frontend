import React, { useState } from 'react';
import { FlatList } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { Equipment } from 'features/equipment/types/equipment.types';
import Button from 'shared/components/Button';
import ButtonRow from 'shared/components/ButtonRow';
import Card from 'shared/components/Card';
import ClickableList from 'shared/components/ClickableList';
import DividerWithLabel from 'shared/components/DividerWithLabel';
import NoResults from 'shared/components/NoResults';
import SearchInput from 'shared/components/SearchInput';
import { useTheme } from 'shared/theme/ThemeProvider';
import { spacing } from 'shared/theme/tokens';

interface EquipmentListProps {
  equipments: Equipment[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onExercisePress: (id: number) => void;
}

const EquipmentList = React.memo(
  ({ equipments, onEdit, onDelete, onExercisePress }: EquipmentListProps) => {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [exerciseSearch, setExerciseSearch] = useState('');
    const { theme } = useTheme();

    const renderItem = ({ item }: { item: Equipment }) => {
      const isExpanded = expandedId === item.id;
      const filteredExercises = isExpanded
        ? (item.compatibleExercises?.filter((ex) =>
            ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()),
          ) ?? [])
        : [];

      return (
        <Card variant="glass" style={{ marginBottom: spacing.md }}>
          <ClickableList
            items={[
              {
                id: item.id,
                label: item.name,
                subLabel: `${item.brand} • ${item.compatibleExercises?.length ?? 0} exercises`,
                selected: isExpanded,
                onPress: () => {
                  setExpandedId((prev) => (prev === item.id ? null : item.id));
                  setExerciseSearch('');
                },
                rightElement: (
                  <FontAwesome
                    name={isExpanded ? 'chevron-down' : 'chevron-right'}
                    size={16}
                    color={theme.colors.accentStart}
                  />
                ),
                content: isExpanded ? (
                  <>
                    <ButtonRow>
                      <Button text="Edit" fullWidth onPress={() => onEdit(item.id)} />
                      <Button text="Delete" fullWidth onPress={() => onDelete(item.id)} />
                    </ButtonRow>
                    <DividerWithLabel label="Compatible Exercises" />
                    <SearchInput
                      placeholder="Search exercises..."
                      value={exerciseSearch}
                      onChange={setExerciseSearch}
                      onClear={() => setExerciseSearch('')}
                    />
                    {filteredExercises.length > 0 ? (
                      <ClickableList
                        items={filteredExercises.map((ex) => ({
                          id: ex.id,
                          label: ex.name,
                          onPress: () => onExercisePress(ex.id),
                        }))}
                      />
                    ) : (
                      <NoResults message="No matching exercises." />
                    )}
                  </>
                ) : undefined,
              },
            ]}
          />
        </Card>
      );
    };

    return (
      <FlatList
        data={equipments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<NoResults message="No equipment found." />}
      />
    );
  },
);

export default EquipmentList;
