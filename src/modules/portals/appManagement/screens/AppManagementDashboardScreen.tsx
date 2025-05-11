import React from 'react';
import {useNavigate} from 'react-router-native';
import {useQuery, useSubscription} from '@apollo/client';
import {GET_PENDING_GYMS} from '../../../gym/graphql/gym.queries';
import {GYM_FRAGMENT} from 'modules/gym/graphql/gym.fragments';
import {
  GYM_CREATED_SUBSCRIPTION,
  GYM_APPROVED_SUBSCRIPTION,
} from '../../../gym/graphql/gym.subscriptions';
import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import Title from 'shared/components/Title';
import Button from 'shared/components/Button';

const AppDashboardScreen = () => {
  const navigate = useNavigate();
  const {data, loading} = useQuery(GET_PENDING_GYMS, {
    fetchPolicy: 'cache-first',
  });

  const pendingCount = data?.pendingGyms?.length || 0;

  useSubscription(GYM_CREATED_SUBSCRIPTION, {
    onData: ({client, data}) => {
      const newGym = data.data?.gymCreated;
      if (!newGym) return;

      client.cache.updateQuery({query: GET_PENDING_GYMS}, existing => {
        if (!existing?.pendingGyms) return existing;
        return {
          ...existing,
          pendingGyms: [newGym, ...existing.pendingGyms],
        };
      });
    },
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

  return (
    <ScreenLayout>
      <Card variant="glass" title="📊 App Management Dashboard" compact />
      <Card variant="glass">
        <Title
          text="📝 Pending Gyms"
          subtitle={`${pendingCount} gyms waiting for approval`}
        />
        <Button
          onPress={() => navigate('/pending-gyms')}
          text="Review Pending Gyms"
        />
      </Card>
    </ScreenLayout>
  );
};

export default AppDashboardScreen;
