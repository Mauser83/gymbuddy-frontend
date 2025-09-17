import { useSubscription } from '@apollo/client';
import React, { useEffect } from 'react';
import Toast from 'react-native-toast-message';

import { useAuth } from 'src/features/auth/context/AuthContext';

import { USER_ROLE_UPDATED } from '../graphql/auth.subscriptions';

const RoleSubscriptionWatcher: React.FC = () => {
  const { user, logout } = useAuth();
  // console.log('RoleSubscriptionWatcher: rendering, user', user?.id);
  const { data, error } = useSubscription(USER_ROLE_UPDATED);
  // console.log('RoleSubscriptionWatcher: subscription initialized');

  useEffect(() => {
    if (data?.userRoleUpdated?.id === user?.id) {
      // console.log('RoleSubscriptionWatcher: role update detected, logging out');
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

  if (error) {
    console.log('RoleSubscriptionWatcher subscription error:', error);
  }

  // useEffect(() => {
  //   if (data) {
  //     console.log('RoleSubscriptionWatcher data:', data);
  //   }
  // }, [data]);

  return null;
};

export default RoleSubscriptionWatcher;
