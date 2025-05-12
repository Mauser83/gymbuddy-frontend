import React, {useEffect} from 'react';
import {useNavigate} from 'react-router-native';
import {useAuth} from '../../../auth/context/AuthContext';
import {GymRole} from 'modules/gym/types/gym.types';
import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import Title from 'shared/components/Title';
import NoResults from 'shared/components/NoResults';
import ClickableList from 'shared/components/ClickableList';

const GymAdminDashboard = () => {
  const {user} = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const isGymManager =
      user?.gymManagementRoles?.some(
        (role: GymRole) =>
          role.role === 'GYM_ADMIN' || role.role === 'GYM_MODERATOR',
      ) ?? false;

    const isAppAdmin =
      user?.appRole === 'ADMIN' || user?.appRole === 'MODERATOR';

    if (!user || (!isGymManager && !isAppAdmin)) {
      navigate('/');
    }
  }, [user]);

  const gyms = user?.gymManagementRoles?.map(r => r.gym) ?? [];

  return (
    <ScreenLayout>
      <Card variant="glass" title="Gym Management Dashboard" compact />

      {/* My Gyms Section */}
      <Card variant="glass">
        <Title text="🏢 My Gyms" />
        {gyms.length === 0 ? (
          <NoResults message="No gyms assigned yet." />
        ) : (
          <ClickableList
            items={gyms.map(gym => ({
              id: gym.id,
              label: gym.name,
              subLabel: gym.isApproved ? '' : '(Pending)',
              onPress: () => navigate(`/gym-admin/gyms/${gym.id}`),
            }))}
          />
        )}
      </Card>
    </ScreenLayout>
  );
};

export default GymAdminDashboard;

