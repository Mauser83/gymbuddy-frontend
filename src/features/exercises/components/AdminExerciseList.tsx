import React, { memo, useState } from 'react';
import { FlatList } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { Exercise } from 'src/features/exercises/types/exercise.types';
import Button from 'src/shared/components/Button';
import ButtonRow from 'src/shared/components/ButtonRow';
import Card from 'src/shared/components/Card';
import ClickableList from 'src/shared/components/ClickableList';
import NoResults from 'src/shared/components/NoResults';
import { useTheme } from 'src/shared/theme/ThemeProvider';
import { spacing } from 'src/shared/theme/tokens';

type Props = {
  exercises: Exercise[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
};

const AdminExerciseListComponent: React.FC<Props> = ({ exercises, onEdit, onDelete }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { theme } = useTheme();

  const renderItem = ({ item }: { item: Exercise }) => {
    const isExpanded = expandedId === item.id;
    return (
      <Card variant="glass" style={{ marginBottom: spacing.md }}>
        <ClickableList
          items={[
            {
              id: item.id,
              label: item.name,
              subLabel: item.exerciseType?.name || '—',
              selected: isExpanded,
              onPress: () => setExpandedId((prev) => (prev === item.id ? null : item.id)),
              rightElement: (
                <FontAwesome
                  name={isExpanded ? 'chevron-down' : 'chevron-right'}
                  size={16}
                  color={theme.colors.accentStart}
                />
              ),
              content: isExpanded ? (
                <ButtonRow>
                  <Button text="Edit" fullWidth onPress={() => onEdit(item.id)} />
                  <Button text="Delete" fullWidth onPress={() => onDelete(item.id)} />
                </ButtonRow>
              ) : undefined,
            },
          ]}
        />
      </Card>
    );
  };

  return (
    <FlatList
      data={exercises}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      ListEmptyComponent={<NoResults message="No exercises found." />}
      showsVerticalScrollIndicator={false}
    />
  );
};

const AdminExerciseList = memo(AdminExerciseListComponent);
AdminExerciseList.displayName = 'AdminExerciseList';

export default AdminExerciseList;
