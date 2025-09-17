import { useLazyQuery, useMutation } from '@apollo/client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { useNavigate } from 'react-router-native';

import { useAuth } from 'src/features/auth/context/AuthContext';
import EquipmentList from 'src/features/equipment/components/EquipmentList';
import {
  GET_ALL_EQUIPMENTS,
  DELETE_EQUIPMENT,
} from 'src/features/equipment/graphql/equipment.graphql';
import { Equipment } from 'src/features/equipment/types/equipment.types';
import Button from 'src/shared/components/Button';
import LoadingState from 'src/shared/components/LoadingState';
import SearchInput from 'src/shared/components/SearchInput';
import { spacing } from 'src/shared/theme/tokens';
import { debounce } from 'src/shared/utils/helpers';

import ScreenLayout from '../../shared/components/ScreenLayout';

const GlobalEquipmentListScreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

  const [fetchEquipments, { data, loading }] = useLazyQuery(GET_ALL_EQUIPMENTS, {
    fetchPolicy: 'cache-and-network',
  });
  const [deleteEquipment] = useMutation(DELETE_EQUIPMENT);

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteEquipment({ variables: { id } });
        fetchEquipments({ variables: { search: searchQuery || undefined } });
      } catch (err) {
        console.error('Failed to delete equipment', err);
      }
    },
    [deleteEquipment, fetchEquipments, searchQuery],
  );
  useEffect(() => {
    fetchEquipments();
  }, [fetchEquipments]);

  const debouncedFetch = useMemo(
    () =>
      debounce((q: string) => {
        fetchEquipments({ variables: { search: q || undefined } });
      }, 500),
    [fetchEquipments],
  );

  useEffect(() => {
    debouncedFetch(searchQuery);
  }, [searchQuery, debouncedFetch]);

  const equipments: Equipment[] = useMemo(
    () => [...(data?.allEquipments ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [data],
  );

  const handleEdit = useCallback((id: number) => navigate(`/equipment/edit/${id}`), [navigate]);

  const handleExercisePress = useCallback((id: number) => navigate(`/exercise/${id}`), [navigate]);

  return (
    <ScreenLayout>
      <SearchInput
        placeholder="Search equipment..."
        onChange={setSearchQuery}
        value={searchQuery}
        onClear={() => setSearchQuery('')}
      />
      <View style={{ marginVertical: spacing.md }}>
        <Button text="➕ Create New Equipment" onPress={() => navigate('/equipment/create')} />
      </View>
      {loading && equipments.length === 0 ? (
        <LoadingState text="Loading equipment..." />
      ) : (
        <EquipmentList
          equipments={equipments}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onExercisePress={handleExercisePress}
        />
      )}
    </ScreenLayout>
  );
};

export default GlobalEquipmentListScreen;
