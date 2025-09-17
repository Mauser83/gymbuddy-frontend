import React from 'react';
import { Navigate, useParams } from 'react-router-native';

import { useRole, Role } from 'src/features/auth/context/RoleContext';

interface RequireRoleProps {
  roles: Role[];
  children: React.ReactElement;
  checkGymId?: boolean;
}

const RequireRole = ({ roles, children, checkGymId }: RequireRoleProps) => {
  const { activeRole } = useRole();
  const params = useParams();

  if (!activeRole || !roles.includes(activeRole.role)) {
    return <Navigate to="/select-role" replace />;
  }

  if (checkGymId && activeRole.gymId && params.gymId && params.gymId !== activeRole.gymId) {
    return <Navigate to="/select-role" replace />;
  }

  return children;
};

export default RequireRole;
