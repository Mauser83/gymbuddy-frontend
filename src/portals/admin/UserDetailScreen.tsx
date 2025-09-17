import { useQuery, useMutation } from '@apollo/client';
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useParams, useNavigate } from 'react-router-native';

import { useAuth } from 'features/auth/context/AuthContext';
import { EditRolesModal } from 'features/users/components/EditRolesModal';
import Button from 'shared/components/Button';
import Card from 'shared/components/Card';
import DetailField from 'shared/components/DetailField';
import ErrorMessage from 'shared/components/ErrorMessage';
import GymRoleEntry from 'shared/components/GymRoleEntry';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';
import RolePill from 'shared/components/RolePill';
import RolePillExpandable from 'shared/components/RolePillExpandable';
import ScreenLayout from 'shared/components/ScreenLayout';
import { formatDate } from 'shared/utils';

import { UPDATE_USER_ROLES } from '../../features/users/graphql/user.mutations';
import { GET_USER_BY_ID } from '../../features/users/graphql/user.queries';

const UserDetailScreen = () => {
  const { id: idParam } = useParams<{ id: string }>();
  if (!idParam) {
    throw new Error('Missing ID in URL');
  }
  const id = parseInt(idParam, 10);

  if (isNaN(id)) {
    throw new Error('Invalid ID in URL');
  }

  const [modalVisible, setModalVisible] = useState(false);
  const [gymRolesExpanded, setGymRolesExpanded] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useQuery(GET_USER_BY_ID, {
    variables: { id },
    fetchPolicy: 'cache-first',
  });

  const [updateUserRoles] = useMutation(UPDATE_USER_ROLES);
  const selectedUser = data?.userById;

  useEffect(() => {
    if (!user || (user.appRole !== 'ADMIN' && user.appRole !== 'MODERATOR')) {
      navigate('/');
    }
  }, [user]);

  const onEditSave = async (appRole: string | null, userRole: string) => {
    try {
      await updateUserRoles({
        variables: {
          userId: selectedUser.id,
          input: {
            appRole: appRole !== 'NONE' ? appRole : null,
            userRole,
          },
        },
      });

      if (selectedUser.id === user?.id) {
        Toast.show({
          type: 'info',
          text1: 'Roles updated',
          text2: 'You will be logged out due to security change.',
        });
        setTimeout(() => {
          console.log('UserDetailScreen: logging out after role update');
          logout();
        }, 3000);
      } else {
        refetch();
      }

      setModalVisible(false);
    } catch (err) {
      console.error('Failed to update roles:', err);
    }
  };

  return (
    <ScreenLayout scroll>
      {loading ? (
        <LoadingState text="Loading user details..." />
      ) : error ? (
        <ErrorMessage message={error.message} />
      ) : !selectedUser ? (
        <NoResults message="User not found." />
      ) : (
        <>
          <Card variant="glass" compact title="Manage User" />

          <Card variant="user">
            <DetailField label="👤 Username:" value={selectedUser.username || 'Unknown'} />
            <DetailField label="📧 Email:" value={selectedUser.email} />

            {selectedUser.appRole && <RolePill type="app" role={selectedUser.appRole} />}

            {selectedUser.userRole && <RolePill type="user" role={selectedUser.userRole} />}

            {selectedUser.gymManagementRoles?.length > 0 && (
              <>
                <RolePillExpandable
                  type="gym"
                  expanded={gymRolesExpanded}
                  onToggle={() => setGymRolesExpanded(!gymRolesExpanded)}
                  count={selectedUser.gymManagementRoles.length}
                />

                {gymRolesExpanded &&
                  selectedUser.gymManagementRoles.map((gr: any, idx: number) => (
                    <GymRoleEntry key={idx} gymName={gr.gym.name} role={gr.role} />
                  ))}
              </>
            )}

            <DetailField label="📅 Joined:" value={formatDate(selectedUser.createdAt)} />

            <View style={{ marginTop: 20 }}>
              <Button text="Edit Roles" onPress={() => setModalVisible(true)} />
            </View>
          </Card>
        </>
      )}

      {selectedUser && (
        <EditRolesModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={onEditSave}
          initialAppRole={selectedUser.appRole}
          initialUserRole={selectedUser.userRole}
          username={selectedUser.username || 'Unknown'}
        />
      )}
    </ScreenLayout>
  );
};

export default UserDetailScreen;
