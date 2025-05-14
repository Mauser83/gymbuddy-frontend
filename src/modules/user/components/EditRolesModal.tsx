import React, {useState, useEffect} from 'react';
import {useAuth} from '../../../modules/auth/context/AuthContext';
import ModalWrapper from 'shared/components/ModalWrapper';
import Button from 'shared/components/Button';
import SelectableField from 'shared/components/SelectableField';
import ButtonRow from 'shared/components/ButtonRow';
import Title from 'shared/components/Title';
import OptionItem from 'shared/components/OptionItem';

interface EditRolesModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (appRole: string | null, userRole: string) => void;
  initialAppRole?: string | null;
  initialUserRole?: string;
  username: string;
}

const appRoles = ['ADMIN', 'MODERATOR', 'NONE'];
const userRoles = ['USER', 'PREMIUM_USER', 'PERSONAL_TRAINER'];

export const EditRolesModal = ({
  visible,
  onClose,
  onSave,
  initialAppRole = 'NONE',
  initialUserRole = 'USER',
  username,
}: EditRolesModalProps) => {
  const {user} = useAuth();
  const currentUserAppRole = user?.appRole;
  const [initialAppRoleState, setInitialAppRoleState] =
    useState(initialAppRole);
  const [initialUserRoleState, setInitialUserRoleState] =
    useState(initialUserRole);
  const [selectedAppRole, setSelectedAppRole] = useState(initialAppRole);
  const [selectedUserRole, setSelectedUserRole] = useState(initialUserRole);
  const [selectingField, setSelectingField] = useState<
    'appRole' | 'userRole' | null
  >(null);

  useEffect(() => {
    if (visible) {
      setInitialAppRoleState(initialAppRole || 'NONE');
      setInitialUserRoleState(initialUserRole || 'USER');
      setSelectedAppRole(initialAppRole || 'NONE');
      setSelectedUserRole(initialUserRole || 'USER');
    }
  }, [visible, initialAppRole, initialUserRole]);

  const isAppRoleChanged = selectedAppRole !== initialAppRoleState;
  const isUserRoleChanged = selectedUserRole !== initialUserRoleState;

  const isSaveDisabled = !isAppRoleChanged && !isUserRoleChanged;

  const openSelector = (field: 'appRole' | 'userRole') => {
    setSelectingField(field);
  };

  const handleSelect = (value: string) => {
    if (selectingField === 'appRole') {
      setSelectedAppRole(value);
    } else if (selectingField === 'userRole') {
      setSelectedUserRole(value);
    }
    setSelectingField(null);
  };

  return (
    <>
      {!selectingField && (
        <ModalWrapper visible={visible} onClose={onClose}>
          <Title text="Edit User Roles" subtitle={`Editing: ${username}`} />

          {/* App Role Picker */}
          <SelectableField
            label="App Role"
            value={selectedAppRole ?? 'NONE'}
            onPress={() => openSelector('appRole')}
            disabled={currentUserAppRole !== 'ADMIN'}
          />

          {/* User Role Picker */}
          <SelectableField
            label="User Role"
            value={selectedUserRole}
            onPress={() => openSelector('userRole')}
          />

          {/* Action Buttons */}
          <ButtonRow>
            <Button text="Cancel" fullWidth onPress={onClose} />

            <Button
              text="Save"
              fullWidth
              onPress={() => {
                if (!isSaveDisabled) {
                  onSave(selectedAppRole, selectedUserRole);
                }
              }}
              disabled={isSaveDisabled}
            />
          </ButtonRow>
        </ModalWrapper>
      )}

      {/* Selection Modal */}
      {selectingField && (
        <ModalWrapper visible onClose={() => setSelectingField(null)}>
            <Title
              text={`Edit ${selectingField === 'userRole' ? 'user role' : 'app role'}`}
              subtitle={`for ${username}`}
            />
            {(selectingField === 'appRole' ? appRoles : userRoles).map(
              option => (
                <OptionItem
                  key={option}
                  text={option}
                  onPress={() => handleSelect(option)}
                />
              ),
            )}
        </ModalWrapper>
      )}
    </>
  );
};
