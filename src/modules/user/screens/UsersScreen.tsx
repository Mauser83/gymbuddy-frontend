import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
} from 'react-native';
import {useQuery, useSubscription} from '@apollo/client';
import {useNavigate} from 'react-router-native';

import {useAuth} from '../../auth/context/AuthContext';
import {useTheme} from '../../../shared/theme/ThemeProvider';

import {GET_USERS} from '../graphql/user.queries';
import {USER_UPDATED_SUBSCRIPTION} from '../graphql/user.subscriptions';
import {USER_FRAGMENT} from '../graphql/user.fragments';
import {User} from 'modules/user/types/user';

import Input from 'shared/components/Input';
import FormError from 'shared/components/FormError';
import Card from 'shared/components/Card';
import ScreenLayout from 'shared/components/ScreenLayout';

const UsersScreen = () => {
  const {theme, componentStyles} = useTheme();
  const {user} = useAuth();
  const navigate = useNavigate();

  const {loading, error, data, refetch} = useQuery(GET_USERS, {
    fetchPolicy: 'cache-and-network',
  });

  const [users, setUsers] = useState<User[]>([]);
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
    const handler = setTimeout(() => {
      refetch({search: searchQuery.length > 0 ? searchQuery : undefined});
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (data?.users) {
      setUsers(data.users);
    }
  }, [data]);

  useEffect(() => {
    if (!user || (user.appRole !== 'ADMIN' && user.appRole !== 'MODERATOR')) {
      navigate('/');
    }
  }, [user]);

  const renderItem = ({item}: {item: User}) => (
    <TouchableOpacity onPress={() => navigate(`/users/${item.id}`)}>
      <Card
        variant="user"
        title={item.username}
        text={item.email}
        compact
        showChevron
      />
    </TouchableOpacity>
  );

  return (
    <ScreenLayout>
      <Card variant="glass" compact title="Manage Users" />

      <Input
        label="Search"
        placeholder="Search by username or email"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.accentStart}
          style={{marginTop: 24}}
        />
      ) : error ? (
        <FormError message="Error fetching users." />
      ) : users.length === 0 ? (
        <Text style={componentStyles.card.glassText}>😕 No users found</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{paddingTop: 16}}
        />
      )}
    </ScreenLayout>
  );
};

export default UsersScreen;
