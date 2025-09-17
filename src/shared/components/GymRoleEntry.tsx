import React from 'react';
import { View, Text } from 'react-native';

import { useTheme } from 'shared/theme/ThemeProvider';

interface GymRoleEntryProps {
  gymName: string;
  role: string;
}

const GymRoleEntry = ({ gymName, role }: GymRoleEntryProps) => {
  const { componentStyles } = useTheme();
  const styles = componentStyles.gymRoleEntry;

  return (
    <View style={styles.container}>
      <Text style={styles.gymName}>{gymName}</Text>
      <Text style={styles.role}>{role.replace(/_/g, ' ').toUpperCase()}</Text>
    </View>
  );
};

export default GymRoleEntry;
