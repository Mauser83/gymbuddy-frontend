import { useLazyQuery, useSubscription } from '@apollo/client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import { useNavigate } from 'react-router-native';

import { useAuth } from 'src/features/auth/context/AuthContext';
import GymsList from 'src/features/gyms/components/GymsList';
import { GYM_FRAGMENT } from 'src/features/gyms/graphql/gym.fragments';
import { GET_GYMS } from 'src/features/gyms/graphql/gym.queries';
import { GYM_APPROVED_SUBSCRIPTION } from 'src/features/gyms/graphql/gym.subscriptions';
import { Gym } from 'src/features/gyms/types/gym.types';
import Button from 'src/shared/components/Button';
import Card from 'src/shared/components/Card';
import LoadingState from 'src/shared/components/LoadingState';
import NoResults from 'src/shared/components/NoResults';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import SearchInput from 'src/shared/components/SearchInput';
import { spacing } from 'src/shared/theme/tokens';
import { debounce } from 'src/shared/utils/helpers';

const GymsScreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [fetchGyms, { loading, data }] = useLazyQuery(GET_GYMS, {
    fetchPolicy: 'cache-and-network',
  });

  useSubscription(GYM_APPROVED_SUBSCRIPTION, {
    onData: ({ client, data: subData }) => {
      const updatedGym = subData.data?.gymApproved;
      if (!updatedGym) return;
      client.writeFragment({
        id: `Gym:${updatedGym.id}`,
        fragment: GYM_FRAGMENT,
        data: updatedGym,
      });
    },
  });

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);
  useEffect(() => {
    fetchGyms();
  }, [fetchGyms]);

  const debouncedFetch = useMemo(
    () =>
      debounce((q: string) => {
        fetchGyms({ variables: { search: q || undefined } });
      }, 500),
    [fetchGyms],
  );

  useEffect(() => {
    debouncedFetch(searchQuery);
  }, [searchQuery, debouncedFetch]);

  const gyms: Gym[] = useMemo(
    () => [...(data?.gyms ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [data],
  );
  const handleGymPress = useCallback((item: Gym) => navigate(`/gyms/${item.id}`), [navigate]);

  return (
    // ScreenLayout is correct with no scroll prop
    <ScreenLayout>
      <Card variant="glass" compact title="Gyms" />
      <SearchInput
        placeholder="Search for gym name or location"
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />
      <View style={{ position: 'relative', marginVertical: spacing.md }}>
        <Button text="➕ Create New Gym" onPress={() => navigate('/gyms/create')} />
      </View>
      {loading && gyms.length === 0 ? (
        <LoadingState text="Loading gyms..." />
      ) : gyms.length === 0 ? (
        <NoResults message="No gyms found." />
      ) : (
        <GymsList gyms={gyms} onGymPress={handleGymPress} />
      )}
    </ScreenLayout>
  );
};

export default GymsScreen;
