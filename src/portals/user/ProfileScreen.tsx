import React, {useState} from 'react';
import {useAuth} from 'features/auth/context/AuthContext';

import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import DetailField from 'shared/components/DetailField';
import RolePill from 'shared/components/RolePill';
import RolePillExpandable from 'shared/components/RolePillExpandable';
import GymRoleEntry from 'shared/components/GymRoleEntry';
import NoResults from 'shared/components/NoResults';

const ProfileScreen = () => {
  const {user} = useAuth();
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
                  <GymRoleEntry
                    key={idx}
                    gymName={gr.gym.name}
                    role={gr.role}
                  />
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
