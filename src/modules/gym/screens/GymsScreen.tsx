import React, {useEffect, useState} from 'react';
import {TouchableOpacity, View} from 'react-native';
import {useQuery, useSubscription} from '@apollo/client';
import {useNavigate} from 'react-router-native';

import {useAuth} from '../../auth/context/AuthContext';
import {GET_GYMS} from '../graphql/gym.queries';
import {GYM_APPROVED_SUBSCRIPTION} from '../graphql/gym.subscriptions';
import {GYM_FRAGMENT} from '../graphql/gym.fragments';
import {Gym} from 'modules/gym/types/gym';

import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import DetailField from 'shared/components/DetailField';
import {useTheme} from 'shared/theme/ThemeProvider';
import Button from 'shared/components/Button';
import NoResults from 'shared/components/NoResults';
import LoadingState from 'shared/components/LoadingState';
import SearchInput from 'shared/components/SearchInput';

const GymsScreen = () => {
  const {user} = useAuth();
  const navigate = useNavigate();
  const {componentStyles} = useTheme();
  const styles = componentStyles.gymsScreen;

  const [searchQuery, setSearchQuery] = useState('');
  const [gyms, setGyms] = useState<Gym[]>([]);

  const {loading, data, refetch} = useQuery(GET_GYMS, {
    fetchPolicy: 'cache-and-network',
  });

  useSubscription(GYM_APPROVED_SUBSCRIPTION, {
    onData: ({client, data}) => {
      const updatedGym = data.data?.gymApproved;
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
  }, [searchQuery]);

  useEffect(() => {
    if (data?.gyms) {
      setGyms(data.gyms);
    }
  }, [data]);

  useEffect(() => {
    if (!user) navigate('/');
  }, [user]);

  if (loading) {
    return (
      <ScreenLayout variant="centered">
        <Card variant="glass">
          <LoadingState text="Loading gyms..." />
        </Card>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <Card variant="glass" compact title="Gyms" />

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />

      <View style={styles.createButtonContainer}>
        <Button
          text="➕ Create New Gym"
          onPress={() => navigate('/gyms/create')}
        />
      </View>

      {gyms.length === 0 ? (
        <NoResults message="No gyms found." />
      ) : (
        gyms.map(gym => (
          <TouchableOpacity
            key={gym.id}
            onPress={() => navigate(`/gyms/${gym.id}`)}>
            <Card variant="glass" compact showChevron>
              <DetailField label="📍 Name:" value={gym.name} />
              <DetailField
                label="🌍 Country:"
                value={gym.country || 'Unknown'}
              />
              <DetailField label="🏙️ City:" value={gym.city || 'Unknown'} />
            </Card>
          </TouchableOpacity>
        ))
      )}
    </ScreenLayout>
  );
};

export default GymsScreen;
