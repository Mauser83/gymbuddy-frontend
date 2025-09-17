import React, { memo } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';

import { User } from 'src/features/users/types/user';
import Card from 'src/shared/components/Card';

interface UsersListProps {
  users: User[];
  onUserPress: (user: User) => void;
}

const UsersListComponent: React.FC<UsersListProps> = ({ users, onUserPress }) => (
  <FlatList
    data={users}
    keyExtractor={(item) => item.id.toString()}
    renderItem={({ item }) => (
      <TouchableOpacity onPress={() => onUserPress(item)}>
        <Card variant="user" title={item.username} text={item.email} compact showChevron />
      </TouchableOpacity>
    )}
    contentContainerStyle={{ paddingTop: 16 }}
  />
);

const UsersList = memo(UsersListComponent);
UsersList.displayName = 'UsersList';

export default UsersList;
