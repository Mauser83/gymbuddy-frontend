import React, {useState} from 'react';
import {FlatList} from 'react-native';
import Card from 'shared/components/Card';
import ClickableList from 'shared/components/ClickableList';
import ButtonRow from 'shared/components/ButtonRow';
import Button from 'shared/components/Button';
import NoResults from 'shared/components/NoResults';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {spacing} from 'shared/theme/tokens';
import {useTheme} from 'shared/theme/ThemeProvider';
import {Exercise} from 'features/exercises/types/exercise.types';

type Props = {
  exercises: Exercise[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
};

const AdminExerciseList = React.memo(({exercises, onEdit, onDelete}: Props) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const {theme} = useTheme();

  const renderItem = ({item}: {item: Exercise}) => {
    const isExpanded = expandedId === item.id;
    return (
      <Card variant="glass" style={{marginBottom: spacing.md}}>
        <ClickableList
          items={[
            {
              id: item.id,
              label: item.name,
              subLabel: item.exerciseType?.name || '—',
              selected: isExpanded,
              onPress: () =>
                setExpandedId(prev => (prev === item.id ? null : item.id)),
              rightElement: (
                <FontAwesome
                  name={isExpanded ? 'chevron-down' : 'chevron-right'}
                  size={16}
                  color={theme.colors.accentStart}
                />
              ),
              content: isExpanded ? (
                <ButtonRow>
                  <Button
                    text="Edit"
                    fullWidth
                    onPress={() => onEdit(item.id)}
                  />
                  <Button
                    text="Delete"
                    fullWidth
                    onPress={() => onDelete(item.id)}
                  />
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
      keyExtractor={item => item.id.toString()}
      ListEmptyComponent={<NoResults message="No exercises found." />}
      showsVerticalScrollIndicator={false}
    />
  );
});

export default AdminExerciseList;