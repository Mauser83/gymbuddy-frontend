import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {useAuth} from '../../../modules/auth/context/AuthContext';

import ModalWrapper from 'shared/components/ModalWrapper';
import Button from 'shared/components/Button';

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
      <ModalWrapper visible={visible} onClose={onClose}>
        <Text style={styles.title}>Edit User Roles</Text>
        <Text style={styles.subTitle}>Editing: {username}</Text>

        {/* App Role Picker */}
        <View style={styles.field}>
          <Text style={styles.label}>App Role</Text>
          <TouchableOpacity
            onPress={
              currentUserAppRole === 'ADMIN'
                ? () => openSelector('appRole')
                : undefined
            }
            activeOpacity={currentUserAppRole === 'ADMIN' ? 0.8 : 1}
            style={[
              styles.picker,
              {
                backgroundColor:
                  currentUserAppRole === 'ADMIN'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(107, 114, 128, 0.3)',
                borderColor:
                  currentUserAppRole === 'ADMIN'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(107, 114, 128, 0.4)',
              },
            ]}>
            <Text
              style={{
                color: currentUserAppRole === 'ADMIN' ? '#f9fafb' : '#9ca3af',
              }}>
              {selectedAppRole}
            </Text>
          </TouchableOpacity>
        </View>

        {/* User Role Picker */}
        <View style={styles.field}>
          <Text style={styles.label}>User Role</Text>
          <TouchableOpacity
            onPress={() => openSelector('userRole')}
            style={styles.picker}
            activeOpacity={0.8}>
            <Text style={styles.pickerText}>{selectedUserRole}</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <Button
            text="Cancel"
            onPress={onClose}
            // style={{flex: 1, marginRight: spacing.sm}}
            variant="outline" // or a variant you support
          />

          <Button
            text="Save"
            onPress={() => {
              if (!isSaveDisabled) {
                onSave(selectedAppRole, selectedUserRole);
              }
            }}
            disabled={isSaveDisabled}
            // style={{ flex: 1, marginLeft: spacing.sm }}
          />
        </View>
      </ModalWrapper>

      {/* Selection Modal */}
      {selectingField && (
        <ModalWrapper visible onClose={() => setSelectingField(null)}>
          <ScrollView>
            {(selectingField === 'appRole' ? appRoles : userRoles).map(
              option => (
                <TouchableOpacity
                  key={option}
                  onPress={() => handleSelect(option)}
                  style={styles.selectorItem}>
                  <Text style={styles.selectorText}>{option}</Text>
                </TouchableOpacity>
              ),
            )}
          </ScrollView>
        </ModalWrapper>
      )}
    </>
  );
};

// File-specific styles
const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f9fafb',
    textAlign: 'center',
    marginBottom: 16,
  },
  subTitle: {
    color: '#9ca3af',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: '#9ca3af',
    marginBottom: 8,
  },
  picker: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  pickerText: {
    color: '#f9fafb',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    marginRight: 8,
    padding: 14,
    borderRadius: 12,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    color: '#f9fafb',
    fontWeight: '600',
  },
  saveGradient: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
  },
  saveBtn: {
    padding: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  selectorCard: {
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    alignSelf: 'center',
  },
  selectorItem: {
    paddingVertical: 14,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
  },
  selectorText: {
    color: '#f9fafb',
    fontSize: 16,
    textAlign: 'center',
  },
});
