import React, { useState, useEffect } from 'react';

import { useAuth } from 'src/features/auth/context/AuthContext';
import Button from 'src/shared/components/Button';
import ButtonRow from 'src/shared/components/ButtonRow';
import ModalWrapper from 'src/shared/components/ModalWrapper';
import OptionItem from 'src/shared/components/OptionItem';
import SelectableField from 'src/shared/components/SelectableField';
import Title from 'src/shared/components/Title';

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
  const { user } = useAuth();
  const currentUserAppRole = user?.appRole;

  const [initialAppRoleState, setInitialAppRoleState] = useState(initialAppRole);
  const [initialUserRoleState, setInitialUserRoleState] = useState(initialUserRole);
  const [selectedAppRole, setSelectedAppRole] = useState(initialAppRole);
  const [selectedUserRole, setSelectedUserRole] = useState(initialUserRole);
  const [selectingField, setSelectingField] = useState<'appRole' | 'userRole' | null>(null);

  useEffect(() => {
    if (visible) {
      setInitialAppRoleState(initialAppRole || 'NONE');
      setInitialUserRoleState(initialUserRole || 'USER');
      setSelectedAppRole(initialAppRole || 'NONE');
      setSelectedUserRole(initialUserRole || 'USER');
      setSelectingField(null);
    }
  }, [visible, initialAppRole, initialUserRole]);

  const isAppRoleChanged = selectedAppRole !== initialAppRoleState;
  const isUserRoleChanged = selectedUserRole !== initialUserRoleState;
  const isSaveDisabled = !isAppRoleChanged && !isUserRoleChanged;

  const handleSelect = (value: string) => {
    if (selectingField === 'appRole') {
      setSelectedAppRole(value);
    } else if (selectingField === 'userRole') {
      setSelectedUserRole(value);
    }
    setSelectingField(null);
  };

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      {selectingField ? (
        <>
          <Title
            text={`Edit ${selectingField === 'userRole' ? 'user role' : 'app role'}`}
            subtitle={`for ${username}`}
          />
          {(selectingField === 'appRole' ? appRoles : userRoles).map((option) => (
            <OptionItem key={option} text={option} onPress={() => handleSelect(option)} />
          ))}
        </>
      ) : (
        <>
          <Title text="Edit User Roles" subtitle={`Editing: ${username}`} />

          <SelectableField
            label="App Role"
            value={selectedAppRole ?? 'NONE'}
            onPress={() => setSelectingField('appRole')}
            disabled={currentUserAppRole !== 'ADMIN'}
          />

          <SelectableField
            label="User Role"
            value={selectedUserRole}
            onPress={() => setSelectingField('userRole')}
          />

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
        </>
      )}
    </ModalWrapper>
  );
};
