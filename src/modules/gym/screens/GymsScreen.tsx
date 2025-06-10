import React, {useEffect, useState} from 'react';
import {TouchableOpacity, View, FlatList} from 'react-native'; // Import FlatList
import {useQuery, useSubscription} from '@apollo/client';
import {useNavigate} from 'react-router-native';

import {useAuth} from '../../auth/context/AuthContext';
import {GET_GYMS} from '../graphql/gym.queries';
import {GYM_APPROVED_SUBSCRIPTION} from '../graphql/gym.subscriptions';
import {GYM_FRAGMENT} from '../graphql/gym.fragments';
import {Gym} from 'modules/gym/types/gym.types';

import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import DetailField from 'shared/components/DetailField';
import Button from 'shared/components/Button';
import NoResults from 'shared/components/NoResults';
import LoadingState from 'shared/components/LoadingState';
import SearchInput from 'shared/components/SearchInput';
import { spacing } from 'shared/theme/tokens';

const GymsScreen = () => {
  const {user} = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  // No need for a separate 'gyms' state, we can use 'data' directly
  const {loading, data, refetch} = useQuery(GET_GYMS, {
    variables: { search: searchQuery || undefined },
    fetchPolicy: 'cache-and-network',
  });

  useSubscription(GYM_APPROVED_SUBSCRIPTION, {
    onData: ({client, data: subData}) => {
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
    const timer = setTimeout(() => {
      refetch({search: searchQuery || undefined});
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, refetch]);

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);
  
  const gyms = data?.gyms ?? [];

  const renderGymItem = ({item}: {item: Gym}) => (
    <TouchableOpacity onPress={() => navigate(`/gyms/${item.id}`)}>
        <Card variant="glass" compact showChevron style={{marginBottom: spacing.md}}>
            <DetailField label="📍 Name:" value={item.name} />
            <DetailField
            label="🌍 Country:"
            value={item.country || 'Unknown'}
            />
            <DetailField label="🏙️ City:" value={item.city || 'Unknown'} />
        </Card>
    </TouchableOpacity>
  );

  const ListHeader = (
      <>
        <Card variant="glass" compact title="Gyms" />
        <SearchInput
            placeholder="Search for gym name or location"
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
        />
        <View style={{ position: 'relative', marginVertical: spacing.md}}>
            <Button
                text="➕ Create New Gym"
                onPress={() => navigate('/gyms/create')}
            />
        </View>
      </>
  );

  return (
    // ScreenLayout is correct with no scroll prop
    <ScreenLayout>
        {loading && gyms.length === 0 ? (
            <LoadingState text="Loading gyms..." />
        ) : (
            <FlatList
                data={gyms}
                renderItem={renderGymItem}
                keyExtractor={item => item.id.toString()}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={<NoResults message="No gyms found." />}
            />
        )}
    </ScreenLayout>
  );
};

export default GymsScreen;
