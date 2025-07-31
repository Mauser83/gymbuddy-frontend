import React, { useEffect } from 'react';
import { useSubscription } from '@apollo/client';
import { USER_ROLE_UPDATED } from '../graphql/auth.subscriptions';
import { useAuth } from '../../../features/auth/context/AuthContext';
import Toast from 'react-native-toast-message';

const RoleSubscriptionWatcher: React.FC = () => {
  const { user, logout } = useAuth();
  const { data, error } = useSubscription(USER_ROLE_UPDATED);

  useEffect(() => {
    if (data?.userRoleUpdated?.id === user?.id) {
      Toast.show({
        type: 'info',
        text1: 'Role Changed',
        text2: 'Your access role was updated. Logging out...',
        visibilityTime: 3000,
        autoHide: true,
        onHide: () => {
          logout();
        },
      });
    }
  }, [data, user, logout]);

  // if (error) {
  //   console.error('Subscription error:', error);
  // }

  return null;
};

export default RoleSubscriptionWatcher;
