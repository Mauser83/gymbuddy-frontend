import React, {useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-native';
import {useQuery, useSubscription} from '@apollo/client';
import {GET_GYM_BY_ID} from '../graphql/gym.queries';
import {GYM_APPROVED_SUBSCRIPTION} from '../graphql/gym.subscriptions';
import {GYM_FRAGMENT} from '../graphql/gym.fragments';
import {Gym} from 'modules/gym/types/gym.types';
import {useAuth} from 'modules/auth/context/AuthContext';

import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import DetailField from 'shared/components/DetailField';
import Title from 'shared/components/Title';
import LoadingState from 'shared/components/LoadingState';
import ErrorMessage from 'shared/components/ErrorMessage';

const GymDetailScreen = () => {
  const {gymId} = useParams<{gymId: string}>();
  const {user} = useAuth();
  const navigate = useNavigate();

  const {data, loading, error} = useQuery(GET_GYM_BY_ID, {
    variables: {id: gymId},
    fetchPolicy: 'cache-first',
  });

  const gym = data?.gymById;

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (!gym) return;

    if (gym.isApproved) return;

    const isGymAdmin = gym.gymRoles?.some(
      (role: Gym['gymRoles'][number]) =>
        role.role === 'GYM_ADMIN' && String(role.user.id) === user.id,
    );

    if (!isGymAdmin) {
      navigate('/');
    }
  }, [user, gym]);

  useSubscription(GYM_APPROVED_SUBSCRIPTION, {
    skip: gym?.isApproved,
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

  if (loading) {
    return (
      <ScreenLayout variant="centered">
        <Card variant="glass">
          <LoadingState text="Loading gym details..." />
        </Card>
      </ScreenLayout>
    );
  }

  if (error || !gym) {
    return (
      <ScreenLayout variant="centered">
        <Card variant="glass">
          <ErrorMessage message="❌ Failed to load gym" />
        </Card>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <Card variant="glass" compact title={gym.name} />

      <Card variant="glass">
        {gym.description && (
          <DetailField label="📝 Description:" value={gym.description} />
        )}
        {gym.address && <DetailField label="📍 Address:" value={gym.address} />}
        {gym.city && <DetailField label="🏙️ City:" value={gym.city} />}
        {gym.country && <DetailField label="🌍 Country:" value={gym.country} />}
        {gym.equipment?.length > 0 && (
          <DetailField
            label="🏋️ Equipment Count:"
            value={String(gym.equipment.length)}
          />
        )}
        {gym.trainers?.length > 0 && (
          <DetailField
            label="🧑‍🏫 Trainers Count:"
            value={String(gym.trainers.length)}
          />
        )}

        <Title subtitle="🛡️ Roles:" align="left" />
        {gym.gymRoles?.length > 0 ? (
          <>
            {gym.gymRoles.filter(
              (r: Gym['gymRoles'][number]) => r.role === 'GYM_ADMIN',
            ).length > 0 && (
              <DetailField
                label="👑 Admins:"
                value={gym.gymRoles
                  .filter(
                    (r: Gym['gymRoles'][number]) => r.role === 'GYM_ADMIN',
                  )
                  .map((r: Gym['gymRoles'][number]) => r.user.username)
                  .join(', ')}
              />
            )}
            {gym.gymRoles.filter(
              (r: Gym['gymRoles'][number]) => r.role === 'GYM_MODERATOR',
            ).length > 0 && (
              <DetailField
                label="🛡️ Moderators:"
                value={gym.gymRoles
                  .filter(
                    (r: Gym['gymRoles'][number]) => r.role === 'GYM_MODERATOR',
                  )
                  .map((r: Gym['gymRoles'][number]) => r.user.username)
                  .join(', ')}
              />
            )}
          </>
        ) : (
          <Title subtitle="No roles assigned" />
        )}
      </Card>
    </ScreenLayout>
  );
};

export default GymDetailScreen;
