import { useLazyQuery, useMutation } from '@apollo/client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Alert } from 'react-native';
import { useNavigate } from 'react-router-native';

import { useAuth } from 'src/features/auth/context/AuthContext';
import AdminExerciseList from 'src/features/exercises/components/AdminExerciseList';
import { GET_EXERCISES, DELETE_EXERCISE } from 'src/features/exercises/graphql/exercise.graphql';
import { Exercise } from 'src/features/exercises/types/exercise.types';
import Button from 'src/shared/components/Button';
import LoadingState from 'src/shared/components/LoadingState';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import SearchInput from 'src/shared/components/SearchInput';
import { spacing } from 'src/shared/theme/tokens';
import { debounce } from 'src/shared/utils/helpers';

export default function ExerciseListScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

  const [fetchExercises, { data, loading }] = useLazyQuery(GET_EXERCISES, {
    fetchPolicy: 'cache-and-network',
  });
  const [deleteExercise] = useMutation(DELETE_EXERCISE);

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const debouncedFetch = useMemo(
    () =>
      debounce((q: string) => {
        fetchExercises({ variables: { search: q || undefined } });
      }, 500),
    [fetchExercises],
  );

  useEffect(() => {
    debouncedFetch(searchQuery);
  }, [searchQuery, debouncedFetch]);

  const exercises: Exercise[] = data?.getExercises ?? [];

  const handleEdit = useCallback((id: number) => navigate(`/exercise/edit/${id}`), [navigate]);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteExercise({ variables: { id } });
        fetchExercises({ variables: { search: searchQuery || undefined } });
        Alert.alert('Success', 'Exercise deleted.');
      } catch (err) {
        console.error('Failed to delete exercise', err);
        Alert.alert('Error', 'Failed to delete exercise.');
      }
    },
    [deleteExercise, fetchExercises, searchQuery],
  );

  return (
    <ScreenLayout>
      <SearchInput
        placeholder="Search exercises..."
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />
      <View style={{ marginVertical: spacing.md }}>
        <Button text="Create New Exercise" onPress={() => navigate('/exercise/create')} />
      </View>
      {loading && exercises.length === 0 ? (
        <LoadingState text="Loading exercises..." />
      ) : (
        <AdminExerciseList exercises={exercises} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </ScreenLayout>
  );
}
