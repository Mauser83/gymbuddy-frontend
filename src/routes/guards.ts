import { User } from '../modules/user/types/user';

// routes/guards.ts
export const getDefaultRouteForUser = (user: User | null): string => {
    if (!user) return '/';
  
    if (user.appRole === 'ADMIN' || user.appRole === 'MODERATOR') return '/admin';
  
    const isGymManager = user?.gymManagementRoles?.some(
      role => role.role === 'GYM_ADMIN' || role.role === 'GYM_MODERATOR'
    );
  
    if (isGymManager) return '/gym-admin';
  
    return '/user';
  };
  