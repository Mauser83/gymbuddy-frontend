import React from 'react';
import { View, Text } from 'react-native';

import { useTheme } from 'src/shared/theme/ThemeProvider';

type RoleType = 'app' | 'user' | 'gym';

interface RolePillProps {
  type: RoleType;
  role?: string;
}

const RolePill = ({ type, role }: RolePillProps) => {
  const { theme, componentStyles } = useTheme();

  const backgroundColor =
    type === 'app'
      ? theme.colors.rolePill.app
      : type === 'user'
        ? theme.colors.rolePill.user
        : theme.colors.rolePill.gym;

  const labelPrefix =
    type === 'app' ? '🎖️ App Role' : type === 'user' ? '🧩 User Role' : '🏋️ Gym Role';

  const formattedRole = role?.replace(/_/g, ' ').toUpperCase();
  const labelText = role ? `${labelPrefix}: ${formattedRole}` : labelPrefix;

  return (
    <View style={[componentStyles.rolePill.container, { backgroundColor }]}>
      <Text style={componentStyles.rolePill.text}>{labelText}</Text>
    </View>
  );
};

export default RolePill;
