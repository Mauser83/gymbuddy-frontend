import { useQuery, useSubscription } from '@apollo/client';
import React from 'react';
import { View } from 'react-native';
import { useNavigate } from 'react-router-native';

import { GYM_FRAGMENT } from 'src/features/gyms/graphql/gym.fragments';
import { GET_PENDING_GYMS } from 'src/features/gyms/graphql/gym.queries';
import {
  GYM_CREATED_SUBSCRIPTION,
  GYM_APPROVED_SUBSCRIPTION,
} from 'src/features/gyms/graphql/gym.subscriptions';
import Button from 'src/shared/components/Button';
import Card from 'src/shared/components/Card';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import Title from 'src/shared/components/Title';

const AppDashboardScreen = () => {
  const navigate = useNavigate();
  const { data } = useQuery(GET_PENDING_GYMS, {
    fetchPolicy: 'cache-first',
  });

  const pendingCount = data?.pendingGyms?.length || 0;

  useSubscription(GYM_CREATED_SUBSCRIPTION, {
    onData: ({ client, data: subData }) => {
      const newGym = subData.data?.gymCreated;
      if (!newGym) return;

      client.cache.updateQuery({ query: GET_PENDING_GYMS }, (existing) => {
        if (!existing?.pendingGyms) return existing;
        return {
          ...existing,
          pendingGyms: [newGym, ...existing.pendingGyms],
        };
      });
    },
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

  return (
    // --- FIX APPLIED HERE ---
    // Added the `scroll` prop to allow the list of cards to scroll.
    <ScreenLayout scroll>
      <View style={{ width: '100%' }}>
        <Card variant="glass" title="📊 App Management Dashboard" compact />
        <Card variant="glass">
          <Title text="📝 Pending Gyms" subtitle={`${pendingCount} gyms waiting for approval`} />
          <Button onPress={() => navigate('/pending-gyms')} text="Review Pending Gyms" />
        </Card>
        <Card variant="glass">
          <Title text="🛠️ Equipments" subtitle="View and manage global equipments" />
          <Button onPress={() => navigate('/equipment')} text="Manage Global Equipments" />
        </Card>

        <Card variant="glass">
          <Title text="🛠️ Exercises" subtitle="View and manage global exercises" />
          <Button onPress={() => navigate('/exercise')} text="Manage Global Exercises" />
        </Card>

        <Card variant="glass">
          <Title text="🛠️ Workout plans" subtitle="View and manage workout plans" />
          <Button onPress={() => navigate('/workoutplan/builder')} text="Manage Workout Plans" />
        </Card>

        <Card variant="glass">
          <Title text="🛠️ System Catalogs" subtitle="Admin-only controls for static entities" />
          <Button onPress={() => navigate('/admin/catalog')} text="Manage System Catalogs" />
        </Card>
      </View>
    </ScreenLayout>
  );
};

export default AppDashboardScreen;
