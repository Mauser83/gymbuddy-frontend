import React, { useState } from 'react';

import { useAuth } from 'src/features/auth/context/AuthContext';
import Card from 'src/shared/components/Card';
import DetailField from 'src/shared/components/DetailField';
import GymRoleEntry from 'src/shared/components/GymRoleEntry';
import NoResults from 'src/shared/components/NoResults';
import RolePill from 'src/shared/components/RolePill';
import RolePillExpandable from 'src/shared/components/RolePillExpandable';
import ScreenLayout from 'src/shared/components/ScreenLayout';

const ProfileScreen = () => {
  const { user } = useAuth();
  const [gymRolesExpanded, setGymRolesExpanded] = useState(false);

  if (!user) {
    return (
      <ScreenLayout variant="centered">
        <Card variant="glass">
          <NoResults message="No user data available" />
        </Card>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout scroll>
      <Card variant="glass" compact title="My profile" />

      <Card variant="user">
        <DetailField label="👤 Username:" value={user.username || 'Unknown'} />
        <DetailField label="📧 Email:" value={user.email} />

        {user.appRole && <RolePill type="app" role={user.appRole} />}
        <RolePill type="user" role={user.userRole} />

        {user.gymManagementRoles && user.gymManagementRoles?.length > 0 && (
          <>
            <RolePillExpandable
              type="gym"
              expanded={gymRolesExpanded}
              onToggle={() => setGymRolesExpanded(!gymRolesExpanded)}
              count={user.gymManagementRoles.length}
            />
            {gymRolesExpanded &&
              user.gymManagementRoles.map((gr, idx) => (
                <GymRoleEntry key={idx} gymName={gr.gym.name} role={gr.role} />
              ))}
          </>
        )}

        <DetailField
          label="📅 Joined:"
          value={new Date(Number(user.createdAt)).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        />
      </Card>
    </ScreenLayout>
  );
};

export default ProfileScreen;
