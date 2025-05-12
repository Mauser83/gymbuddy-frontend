import React, {useEffect} from 'react';
import {View} from 'react-native';
import {useParams, useNavigate} from 'react-router-native';
import {useQuery} from '@apollo/client';
import {useAuth} from '../../../auth/context/AuthContext';
import {GET_GYM_BY_ID} from '../../../gym/graphql/gym.queries';
import {GymRole} from 'modules/gym/types/gym.types';
import ScreenLayout from 'shared/components/ScreenLayout';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';
import Card from 'shared/components/Card';
import Title from 'shared/components/Title';
import DetailField from 'shared/components/DetailField';
import Button from 'shared/components/Button';

const GymManagementScreen = () => {
  const {gymId: idParam} = useParams();
    if (!idParam) {
      throw new Error('Missing ID in URL');
  }
    const gymId = parseInt(idParam, 10);
  
    if (isNaN(gymId)) {
      throw new Error('Invalid ID in URL');
    }
  const {user} = useAuth();
  const navigate = useNavigate();

  const {data, loading} = useQuery(GET_GYM_BY_ID, {
    variables: {id: gymId},
  });

  const gym = data?.gymById;

  useEffect(() => {
    if (!user) navigate('/');
  }, [user]);

  if (loading || !gym) {
    return (
      <ScreenLayout>
        {loading ? (
          <LoadingState text="Loading gym..." />
        ) : (
          <NoResults message="Gym not found" />
        )}
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      {/* Gym Header */}
      <Card
        variant="glass"
        title={gym.name}
        text="⏳ Pending Approval"
        compact
      />

      {/* Gym Info */}
      <Card variant="glass">
        <Title text="🏢 Gym Information" />
        <DetailField
          label="📝 Description"
          value={gym.description || 'Not provided'}
        />
        <DetailField label="📍 Address" value={gym.address || 'Not provided'} />
        <DetailField label="📞 Phone" value={gym.phone || 'Not provided'} />
        <DetailField label="✉️ Email:" value={gym.email || 'Not provided'} />
        <DetailField
          label="🔗 Website:"
          value={gym.websiteUrl || 'Not provided'}
        />
        <Button
          onPress={() => navigate(`/gym-admin/gyms/${gymId}/edit`)}
          text="Edit Gym Info"
        />
      </Card>

      {/* Staff Info */}
      <Card variant="glass">
        <Title text="🧑‍💼 Staff" />
        {['GYM_ADMIN', 'GYM_MODERATOR'].map(roleKey => {
          const group = gym.gymRoles.filter((r: GymRole) => r.role === roleKey);
          if (group.length === 0) return null;

          return (
            <View key={roleKey} style={{marginBottom: 16}}>
              <DetailField
                label={
                  roleKey === 'GYM_ADMIN' ? '👑 Admins:' : '🧑 Moderators:'
                }
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
