import React from 'react';
import { useNavigate } from 'react-router-native';

import { useAuth } from 'features/auth/context/AuthContext';
import { useRole, RoleContextState } from 'features/auth/context/RoleContext';
import { getDefaultRouteForRole } from 'routes/guards';
import OptionItem from 'shared/components/OptionItem';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';

const RoleSelectScreen = () => {
  const { user } = useAuth();
  const { setActiveRole } = useRole();
  const navigate = useNavigate();

  if (!user) return null;

  const options: RoleContextState[] = [{ role: 'user' }];

  if (user.userRole === 'PERSONAL_TRAINER') {
    options.push({ role: 'trainer' });
  }

  if (user.appRole === 'ADMIN' || user.appRole === 'MODERATOR') {
    options.push({
      role: 'admin',
      appScopeRole: user.appRole === 'ADMIN' ? 'admin' : 'moderator',
    });
  }

  if (user.gymManagementRoles && user.gymManagementRoles.length > 0) {
    options.push({ role: 'gym-manager' });
  }

  const handleSelect = (opt: RoleContextState) => {
    setActiveRole(opt);
    navigate(getDefaultRouteForRole(opt));
  };

  return (
    <ScreenLayout>
      <Title text="Select Role" />
      {options.map((opt, idx) => (
        <OptionItem
          key={idx}
          text={opt.role === 'gym-manager' ? 'Gym Manager' : opt.role}
          onPress={() => handleSelect(opt)}
        />
      ))}
    </ScreenLayout>
  );
};

export default RoleSelectScreen;
