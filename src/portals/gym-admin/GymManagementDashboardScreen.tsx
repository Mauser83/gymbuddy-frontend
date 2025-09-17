import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useNavigate } from 'react-router-native';

import { useAuth } from 'src/features/auth/context/AuthContext';
import { GymRole } from 'src/features/gyms/types/gym.types';
import Card from 'src/shared/components/Card';
import ClickableList from 'src/shared/components/ClickableList';
import NoResults from 'src/shared/components/NoResults';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import Title from 'src/shared/components/Title';
import { spacing } from 'src/shared/theme/tokens';

const GymAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const isGymManager =
      user?.gymManagementRoles?.some(
        (role: GymRole) => role.role === 'GYM_ADMIN' || role.role === 'GYM_MODERATOR',
      ) ?? false;

    const isAppAdmin = user?.appRole === 'ADMIN' || user?.appRole === 'MODERATOR';

    if (!user || (!isGymManager && !isAppAdmin)) {
      navigate('/');
    }
  }, [user, navigate]);

  const gyms = useMemo(
    () =>
      [...(user?.gymManagementRoles?.map((r) => r.gym) ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [user?.gymManagementRoles],
  );

  return (
    // --- FIX APPLIED HERE ---
    // Added the `scroll` prop to ensure the dashboard is scrollable.
    <ScreenLayout scroll>
      <Card
        variant="glass"
        title="Gym Management Dashboard"
        compact
        style={{ marginBottom: spacing.md }}
      />

      <Card variant="glass">
        <Title text="🏢 My Gyms" />
        {gyms.length === 0 ? (
          <NoResults message="No gyms assigned yet." />
        ) : (
          <ClickableList
            items={gyms.map((gym) => ({
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
