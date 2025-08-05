import React, {useEffect, useState, useMemo, useCallback} from 'react';
import UsersList from 'features/users/components/UsersList';
import {useLazyQuery, useSubscription} from '@apollo/client';
import {useNavigate} from 'react-router-native';

import {useAuth} from '../../features/auth/context/AuthContext';

import {GET_USERS} from '../../features/users/graphql/user.queries';
import {USER_UPDATED_SUBSCRIPTION} from 'features/users/graphql/user.subscriptions';
import {USER_FRAGMENT} from '../../features/users/graphql/user.fragments';
import {User} from 'features/users/types/user';
import {debounce} from 'shared/utils/helpers';

import FormError from 'shared/components/FormError';
import Card from 'shared/components/Card';
import ScreenLayout from 'shared/components/ScreenLayout';
import NoResults from 'shared/components/NoResults';
import LoadingState from 'shared/components/LoadingState';
import SearchInput from 'shared/components/SearchInput';

const UsersScreen = () => {
  const {user} = useAuth();
  const navigate = useNavigate();

  const [fetchUsers, {loading, error, data}] = useLazyQuery(GET_USERS, {
    fetchPolicy: 'cache-and-network',
  });

  const [searchQuery, setSearchQuery] = useState('');

  useSubscription(USER_UPDATED_SUBSCRIPTION, {
    onData: ({client, data}) => {
      const updatedUser = data.data?.userUpdated;
      if (!updatedUser) return;

      client.writeFragment({
        id: `User:${updatedUser.id}`,
        fragment: USER_FRAGMENT,
        data: updatedUser,
      });
    },
  });

  useEffect(() => {
    if (!user || (user.appRole !== 'ADMIN' && user.appRole !== 'MODERATOR')) {
      navigate('/');
    }
  }, [user]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const debouncedFetch = useMemo(
    () =>
      debounce((q: string) => {
        fetchUsers({variables: {search: q || undefined}});
      }, 500),
    [fetchUsers],
  );

  useEffect(() => {
    debouncedFetch(searchQuery);
  }, [searchQuery, debouncedFetch]);

  const users: User[] = data?.users ?? [];

  const handleUserPress = useCallback(
    (item: User) => navigate(`/users/${item.id}`),
    [navigate],
  );

  return (
    <ScreenLayout scroll={false}>
      <Card variant="glass" compact title="Manage Users" />

      <SearchInput
        placeholder="Search for username or email"
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />

      {loading && users.length === 0 ? (
        <LoadingState text="Loading users..." />
      ) : error ? (
        <FormError message="Error fetching users." />
      ) : users.length === 0 ? (
        <NoResults message="No users found" />
      ) : (
        <UsersList users={users} onUserPress={handleUserPress} />
      )}
    </ScreenLayout>
  );
};

export default UsersScreen;