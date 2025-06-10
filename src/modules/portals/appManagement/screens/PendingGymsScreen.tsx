import React from 'react';
import {Alert, FlatList, View} from 'react-native';
import {useQuery, useMutation} from '@apollo/client';
import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import Title from 'shared/components/Title';
import DetailField from 'shared/components/DetailField';
import Button from 'shared/components/Button';

import {GET_PENDING_GYMS} from '../../../gym/graphql/gym.queries';
import {APPROVE_GYM} from '../../../gym/graphql/gym.mutations';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';
import { spacing } from 'shared/theme/tokens';

const PendingGymsScreen = () => {
  const {data, loading, refetch} = useQuery(GET_PENDING_GYMS, {
    fetchPolicy: 'cache-and-network',
  });

  const [approveGym, {loading: approving}] = useMutation(APPROVE_GYM);

  const handleApprove = async (gymId: number) => {
    try {
      await approveGym({
        variables: {gymId},
      });
      // Refetch the data to update the list after approval
      refetch(); 
      Alert.alert('✅ Approved', 'Gym has been approved.');
    } catch (err) {
      console.error(err);
      Alert.alert('❌ Error', 'Failed to approve gym.');
    }
  };

  const pendingGyms = data?.pendingGyms ?? [];

  const renderItem = ({item: gym}: {item: any}) => (
    <Card key={gym.id} variant="glass" style={{marginBottom: spacing.md}}>
        <Title text={gym.name} />
        {gym.description && (
            <DetailField label="Description" value={gym.description} />
        )}
        <DetailField label="Address" value={gym.address} />
        <DetailField
            label="Submitted by"
            value={gym.gymRoles[0]?.user?.username || 'Unknown User'}
        />
        <Button
            onPress={() => handleApprove(gym.id)}
            disabled={approving}
            text={approving ? 'Approving...' : 'Approve'}
        />
    </Card>
  );

  return (
    // Use non-scrolling layout because FlatList handles scrolling
    <ScreenLayout> 
      <FlatList
          data={pendingGyms}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={<Card variant="glass" title="Pending Gym Approvals" compact />}
          ListEmptyComponent={loading ? <LoadingState text="Loading pending gyms..." /> : <NoResults message="🎉 No pending gyms" />}
      />
    </ScreenLayout>
  );
};

export default PendingGymsScreen;
