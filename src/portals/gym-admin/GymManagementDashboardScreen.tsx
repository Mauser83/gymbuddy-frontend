import React, {useEffect} from 'react';
import {useNavigate} from 'react-router-native';
import {useAuth} from '../../features/auth/context/AuthContext';
import {GymRole} from 'features/gyms/types/gym.types';
import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import Title from 'shared/components/Title';
import NoResults from 'shared/components/NoResults';
import ClickableList from 'shared/components/ClickableList';
import { spacing } from 'shared/theme/tokens';
import { View } from 'react-native';

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
  }, [user, navigate]);

  const gyms = user?.gymManagementRoles?.map(r => r.gym) ?? [];

  return (
    // --- FIX APPLIED HERE ---
    // Added the `scroll` prop to ensure the dashboard is scrollable.
    <ScreenLayout scroll>
        <Card variant="glass" title="Gym Management Dashboard" compact style={{ marginBottom: spacing.md }}/>

        <Card variant="glass">
            <Title text="🏢 My Gyms" />
            {gyms.length === 0 ? (
            <NoResults message="No gyms assigned yet." />
            ) : (
            <ClickableList
                items={gyms.map(gym => ({
                id: gym.id,
                label: gym.name,
                subLabel: gym.isApproved ? undefined : '(Pending)',
                onPress: () => navigate(`/gym-admin/gyms/${gym.id}`),
                }))}
            />
            )}
        </Card>
    </ScreenLayout>
  );
};

export default GymAdminDashboard;
