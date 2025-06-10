import React, { useState, useEffect } from 'react';
import { View, Alert, FlatList } from 'react-native';
import { useNavigate } from 'react-router-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { useExercise } from '../../exercise/hooks/useExercise';
import { Exercise } from '../../exercise/types/exercise.types';

import ScreenLayout from 'shared/components/ScreenLayout';
import SearchInput from 'shared/components/SearchInput';
import Button from 'shared/components/Button';
import ClickableList from 'shared/components/ClickableList';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';
import ButtonRow from 'shared/components/ButtonRow';
import { spacing } from 'shared/theme/tokens';
import { useTheme } from 'shared/theme/ThemeProvider';
import { useAuth } from 'modules/auth/context/AuthContext';
import Card from 'shared/components/Card';

export default function ExerciseListScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { getMyExercises, deleteExercise } = useExercise();

  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, loading, refetch } = getMyExercises();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  // --- FIX APPLIED HERE ---
  // Changed data?.myExercises to data?.getExercises to match the actual query result.
  const exercises = data?.getExercises.filter((ex: Exercise) => 
    ex.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const handleDelete = async (id: number) => {
    try {
      await deleteExercise({ variables: { id } });
      Alert.alert('Success', 'Exercise deleted.');
      refetch();
    } catch (err) {
      console.error('Failed to delete exercise', err);
      Alert.alert('Error', 'Failed to delete exercise.');
    }
  };

  const renderItem = ({ item }: { item: Exercise }) => {
    const isExpanded = expandedId === item.id;
    return (
        <Card variant='glass' style={{ marginBottom: spacing.md }}>
            <ClickableList
                items={[{
                    id: item.id,
                    label: item.name,
                    subLabel: item.exerciseType?.name || '—',
                    selected: isExpanded,
                    onPress: () => setExpandedId(prev => (prev === item.id ? null : item.id)),
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
                                onPress={() => navigate(`/exercise/edit/${item.id}`)}
                            />
                            <Button
                                text="Delete"
                                fullWidth
                                onPress={() => handleDelete(item.id)}
                            />
                        </ButtonRow>
                    ) : undefined,
                }]}
            />
        </Card>
    );
  };
  
  const ListHeader = () => (
    <>
        <SearchInput
            placeholder="Search exercises..."
            value={search}
            onChange={setSearch}
            onClear={() => setSearch('')}
        />
        <View style={{ marginVertical: spacing.md }}>
            <Button
                text="➕ Create New Exercise"
                onPress={() => navigate('/exercise/create')}
            />
        </View>
    </>
  );

  return (
    // Use non-scrolling layout as FlatList provides its own scroll
    <ScreenLayout>
      {loading && !data ? (
        <LoadingState text="Loading exercises..." />
      ) : (
        <FlatList
          data={exercises}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={<NoResults message="No exercises found." />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenLayout>
  );
}
