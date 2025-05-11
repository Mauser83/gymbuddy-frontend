import React from 'react';
import {Alert} from 'react-native';
import {useQuery, useMutation} from '@apollo/client';
import {useNavigate} from 'react-router-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import Title from 'shared/components/Title';
import DetailField from 'shared/components/DetailField';
import Button from 'shared/components/Button';

import {GET_PENDING_GYMS} from '../../../gym/graphql/gym.queries';
import {APPROVE_GYM} from '../../../gym/graphql/gym.mutations';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';

const PendingGymsScreen = () => {
  const navigate = useNavigate();

  const {data, loading} = useQuery(GET_PENDING_GYMS, {
    fetchPolicy: 'cache-and-network',
  });
  console.log(data);

  const [approveGym, {loading: approving}] = useMutation(APPROVE_GYM);

  const handleApprove = async (gymId: number) => {
    try {
      await approveGym({
        variables: {gymId},
        update(cache) {
          const existing = cache.readQuery<{pendingGyms: any[]}>({
            query: GET_PENDING_GYMS,
          });

          if (!existing) return;

          cache.writeQuery({
            query: GET_PENDING_GYMS,
            data: {
              pendingGyms: existing.pendingGyms.filter(g => g.id !== gymId),
            },
          });
        },
      });

      Alert.alert('✅ Approved', 'Gym has been approved.');
    } catch (err) {
      console.error(err);
      Alert.alert('❌ Error', 'Failed to approve gym.');
    }
  };

  const pendingGyms = data?.pendingGyms ?? [];

  if (loading) {
    return (
      <ScreenLayout>
        <LoadingState text="Loading pending gyms.." />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <Card variant="glass" title="Pending Gym Approvals" compact />

      {pendingGyms.length === 0 ? (
        <NoResults message="🎉 No pending gyms" />
      ) : (
        pendingGyms.map((gym: any) => (
          <Card key={gym.id} variant="glass">
            <Title text={gym.name} />
            {gym.description && (
              <DetailField label="Description" value={gym.description} />
            )}
            <DetailField label="Address" value={gym.address} />
            <DetailField
              label="Submitted by"
              value={gym.gymRoles[0].user.username}
            />

            <Button
              onPress={() => handleApprove(gym.id)}
              disabled={approving}
              text={approving ? 'Approving...' : 'Approve'}
            />
          </Card>
        ))
      )}
    </ScreenLayout>
  );
};

export default PendingGymsScreen;
