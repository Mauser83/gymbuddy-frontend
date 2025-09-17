// RolePillExpandable.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { useTheme } from 'shared/theme/ThemeProvider';

interface RolePillExpandableProps {
  type: 'gym' | 'app' | 'user';
  role?: string;
  expanded: boolean;
  onToggle: () => void;
  count?: number; // 👈 add this
}

const RolePillExpandable = ({ type, role, expanded, onToggle, count }: RolePillExpandableProps) => {
  const { componentStyles, theme } = useTheme();
  const styles = componentStyles.rolePillExpandable;

  const pillColor = theme.colors.rolePill[type];
  const textColor = type === 'gym' ? theme.colors.textPrimary : 'white';

  const chevron = expanded ? 'chevron-up' : 'chevron-down';

  const labelPrefix =
    type === 'app' ? '🎖️ App Role' : type === 'user' ? '🧩 User Role' : '🏋️ Gym Role';

  const labelText = role
    ? `${labelPrefix}: ${role.replace(/_/g, ' ').toUpperCase()}`
    : count !== undefined
      ? `${labelPrefix} (${count})`
      : labelPrefix;

  return (
    <TouchableOpacity onPress={onToggle} style={{ alignSelf: 'flex-start' }}>
      <View style={[styles.container, { backgroundColor: pillColor }]}>
        <Text style={[styles.text, { color: textColor }]}>{labelText}</Text>
        <FontAwesome name={chevron} style={[styles.icon, { color: textColor }]} />
      </View>
    </TouchableOpacity>
  );
};

export default RolePillExpandable;
