import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
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

export default function ExerciseListScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { getMyExercises, deleteExercise } = useExercise();

  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filtered, setFiltered] = useState<Exercise[]>([]);

  const { data, loading, refetch } = getMyExercises();

  useEffect(() => {
    if (!user) navigate('/');
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!search?.trim()) {
        setFiltered(data?.getExercises || []);
      } else {
        const query = search.toLowerCase();
        const results = data?.getExercises.filter(ex =>
          ex.name.toLowerCase().includes(query)
        ) || [];
        setFiltered(results);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, data]);

const handleDelete = async (id: number) => {
  try {
    await deleteExercise({ variables: { id } });
    await refetch();
  } catch (err) {
    console.error('Failed to delete exercise', err);
  }
};

  if (loading) {
    return (
      <ScreenLayout variant="centered">
        <LoadingState text="Loading exercises..." />
      </ScreenLayout>
    );
  }

  const items = filtered.map((exercise: Exercise) => {
    const isExpanded = expandedId === exercise.id;
    return {
      id: exercise.id,
      label: exercise.name,
      subLabel: exercise.exerciseType?.name || '—',
      selected: isExpanded,
      onPress: () => setExpandedId(prev => (prev === exercise.id ? null : exercise.id)),
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
            onPress={() => navigate(`/exercise/edit/${exercise.id}`)}
          />
          <Button
            text="Delete"
            fullWidth
            onPress={() => handleDelete(exercise.id)}
          />
        </ButtonRow>
      ) : undefined,
    };
  });

  return (
    <ScreenLayout>
      <SearchInput
        placeholder="Search exercises..."
        value={search}
        onChange={setSearch}
        onClear={() => setSearch('')}
      />
      <View style={{ marginBottom: spacing.sm }}>
        <Button
          text="➕ Create New Exercise"
          onPress={() => navigate('/exercise/create')}
        />
      </View>
      {items.length === 0 ? (
        <NoResults message="No exercises found." />
      ) : (
        <ClickableList items={items} />
      )}
    </ScreenLayout>
  );
}
