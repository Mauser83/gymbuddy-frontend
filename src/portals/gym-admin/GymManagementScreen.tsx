import { useQuery } from '@apollo/client';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useParams, useNavigate } from 'react-router-native';

import { useAuth } from 'src/features/auth/context/AuthContext';
import { GET_GYM_BY_ID } from 'src/features/gyms/graphql/gym.queries';
import { GymRole } from 'src/features/gyms/types/gym.types';
import Button from 'src/shared/components/Button';
import Card from 'src/shared/components/Card';
import DetailField from 'src/shared/components/DetailField';
import LoadingState from 'src/shared/components/LoadingState';
import NoResults from 'src/shared/components/NoResults';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import Title from 'src/shared/components/Title';
import { spacing } from 'src/shared/theme/tokens';

const GymManagementScreen = () => {
  const { gymId: idParam } = useParams();
  if (!idParam) {
    throw new Error('Missing ID in URL');
  }
  const gymId = parseInt(idParam, 10);

  if (isNaN(gymId)) {
    throw new Error('Invalid ID in URL');
  }
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, loading } = useQuery(GET_GYM_BY_ID, {
    variables: { id: gymId },
  });

  const gym = data?.gym;

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  if (loading || !gym) {
    return (
      <ScreenLayout>
        {loading ? <LoadingState text="Loading gym..." /> : <NoResults message="Gym not found" />}
      </ScreenLayout>
    );
  }

  return (
    // --- FIX APPLIED HERE ---
    // Added the `scroll` prop to ensure the screen is scrollable.
    <ScreenLayout scroll>
      <Card
        variant="glass"
        title={gym.name}
        text={!gym.isApproved ? '⏳ Pending Approval' : undefined}
        compact
        style={{ marginBottom: spacing.md }}
      />

      <Card variant="glass" style={{ marginBottom: spacing.md }}>
        <Title text="🏢 Gym Information" />
        <DetailField label="📝 Description" value={gym.description || 'Not provided'} />
        <DetailField label="📍 Address" value={gym.address || 'Not provided'} />
        <DetailField label="📞 Phone" value={gym.phone || 'Not provided'} />
        <DetailField label="✉️ Email:" value={gym.email || 'Not provided'} />
        <DetailField label="🔗 Website:" value={gym.websiteUrl || 'Not provided'} />
        <Button onPress={() => navigate(`/gym-admin/gyms/${gymId}/edit`)} text="Edit Gym Info" />
      </Card>

      <Card variant="glass" style={{ marginBottom: spacing.md }}>
        <Title text="Equipment" />
        <DetailField
          label="🏋️ Equipment Items"
          value={`${gym.gymEquipment?.length || 0} assigned`}
        />
        <Button
          onPress={() => navigate(`/gym-admin/gyms/${gymId}/equipment`)}
          text="Manage Equipment"
        />
      </Card>

      <Card variant="glass" style={{ marginBottom: spacing.md }}>
        <Title text="Image Training Candidates" />
        <Button
          onPress={() => navigate(`/gym-admin/gyms/${gymId}/training-candidates`)}
          text="Review Candidates"
        />
      </Card>

      <Card variant="glass">
        <Title text="🧑‍💼 Staff" />
        {['GYM_ADMIN', 'GYM_MODERATOR'].map((roleKey) => {
          const group = gym.gymRoles.filter((r: GymRole) => r.role === roleKey);
          if (group.length === 0) return null;

          return (
            <View key={roleKey} style={{ marginBottom: 16 }}>
              <DetailField
                label={roleKey === 'GYM_ADMIN' ? '👑 Admins:' : '🧑 Moderators:'}
                value={group.map((r: GymRole) => r.user.username).join(', ')}
              />
            </View>
          );
        })}
        <Button onPress={() => navigate(`/gym-admin/gyms/${gymId}/staff`)} text="Manage Staff" />
      </Card>
    </ScreenLayout>
  );
};

export default GymManagementScreen;
