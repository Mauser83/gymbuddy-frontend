import React from 'react';
import {FlatList, TouchableOpacity} from 'react-native';
import Card from 'shared/components/Card';
import {User} from 'features/users/types/user';

interface UsersListProps {
  users: User[];
  onUserPress: (user: User) => void;
}

const UsersList = React.memo(({users, onUserPress}: UsersListProps) => (
  <FlatList
    data={users}
    keyExtractor={item => item.id.toString()}
    renderItem={({item}) => (
      <TouchableOpacity onPress={() => onUserPress(item)}>
        <Card
          variant="user"
          title={item.username}
          text={item.email}
          compact
          showChevron
        />
      </TouchableOpacity>
    )}
    contentContainerStyle={{paddingTop: 16}}
  />
));

export default UsersList;