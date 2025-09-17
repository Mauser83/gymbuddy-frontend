import { useLazyQuery, useSubscription } from '@apollo/client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-native';

import { useAuth } from 'src/features/auth/context/AuthContext';
import UsersList from 'src/features/users/components/UsersList';
import { USER_FRAGMENT } from 'src/features/users/graphql/user.fragments';
import { GET_USERS } from 'src/features/users/graphql/user.queries';
import { USER_UPDATED_SUBSCRIPTION } from 'src/features/users/graphql/user.subscriptions';
import { User } from 'src/features/users/types/user';
import Card from 'src/shared/components/Card';
import FormError from 'src/shared/components/FormError';
import LoadingState from 'src/shared/components/LoadingState';
import NoResults from 'src/shared/components/NoResults';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import SearchInput from 'src/shared/components/SearchInput';
import { debounce } from 'src/shared/utils/helpers';

const UsersScreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fetchUsers, { loading, error, data }] = useLazyQuery(GET_USERS, {
    fetchPolicy: 'cache-and-network',
  });

  const [searchQuery, setSearchQuery] = useState('');

  useSubscription(USER_UPDATED_SUBSCRIPTION, {
    onData: ({ client, data }) => {
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
        fetchUsers({ variables: { search: q || undefined } });
      }, 500),
    [fetchUsers],
  );

  useEffect(() => {
    debouncedFetch(searchQuery);
  }, [searchQuery, debouncedFetch]);

  const users: User[] = useMemo(
    () => [...(data?.users ?? [])].sort((a, b) => a.username.localeCompare(b.username)),
    [data],
  );

  const handleUserPress = useCallback((item: User) => navigate(`/users/${item.id}`), [navigate]);

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
