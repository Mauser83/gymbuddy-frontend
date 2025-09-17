import { useQuery, useMutation } from '@apollo/client';
import React from 'react';
import { Alert, FlatList, View } from 'react-native';

import { APPROVE_GYM } from 'src/features/gyms/graphql/gym.mutations';
import { GET_PENDING_GYMS } from 'src/features/gyms/graphql/gym.queries';
import Button from 'src/shared/components/Button';
import Card from 'src/shared/components/Card';
import DetailField from 'src/shared/components/DetailField';
import LoadingState from 'src/shared/components/LoadingState';
import NoResults from 'src/shared/components/NoResults';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import Title from 'src/shared/components/Title';
import { spacing } from 'src/shared/theme/tokens';

const PendingGymsScreen = () => {
  const { data, loading, refetch } = useQuery(GET_PENDING_GYMS, {
    fetchPolicy: 'cache-and-network',
  });

  const [approveGym, { loading: approving }] = useMutation(APPROVE_GYM);

  const handleApprove = async (gymId: number) => {
    try {
      await approveGym({
        variables: { gymId },
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

  const renderItem = ({ item: gym }: { item: any }) => (
    <Card key={gym.id} variant="glass" style={{ marginBottom: spacing.md }}>
      <Title text={gym.name} />
      {gym.description && <DetailField label="Description" value={gym.description} />}
      <DetailField label="Address" value={gym.address} />
      <DetailField label="Submitted by" value={gym.gymRoles[0]?.user?.username || 'Unknown User'} />
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
        ListEmptyComponent={
          loading ? (
            <LoadingState text="Loading pending gyms..." />
          ) : (
            <NoResults message="🎉 No pending gyms" />
          )
        }
      />
    </ScreenLayout>
  );
};

export default PendingGymsScreen;
