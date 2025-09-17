import { RoleContextState } from 'features/auth/context/RoleContext';

export const getDefaultRouteForRole = (ctx: RoleContextState | null): string => {
  if (!ctx) return '/';
  switch (ctx.role) {
    case 'admin':
      return '/admin';
    case 'gym-manager':
      return '/gym-admin';
    case 'trainer':
      return '/trainer';
    default:
      return '/user';
  }
};
