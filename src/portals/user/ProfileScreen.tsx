import React, {useState} from 'react';
import {useAuth} from 'features/auth/context/AuthContext';
import {useRole} from 'features/auth/context/RoleContext';
import {useNavigate} from 'react-router-native';

import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import Button from 'shared/components/Button';
import DetailField from 'shared/components/DetailField';
import RolePill from 'shared/components/RolePill';
import RolePillExpandable from 'shared/components/RolePillExpandable';
import GymRoleEntry from 'shared/components/GymRoleEntry';
import Title from 'shared/components/Title';
import NoResults from 'shared/components/NoResults';

const ProfileScreen = () => {
  const {user} = useAuth();
  const {activeRole} = useRole();
  const navigate = useNavigate();
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

        {user.gymManagementRoles?.length &&
          user.gymManagementRoles?.length > 0 && (
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
        {(() => {
          const options: string[] = ['user'];
          if (user.userRole === 'PERSONAL_TRAINER') options.push('trainer');
          if (user.appRole === 'ADMIN' || user.appRole === 'MODERATOR')
            options.push('admin');
          if (user.gymManagementRoles && user.gymManagementRoles.length > 0)
            options.push('gym-manager');
          return options.length > 1 ? (
            <Button
              text="Switch Role"
              onPress={() => navigate('/select-role')}
            />
          ) : null;
        })()}
      </Card>
    </ScreenLayout>
  );
};

export default ProfileScreen;
