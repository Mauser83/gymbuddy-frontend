import { FontAwesome5 } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import { useAuth } from 'src/features/auth/context/AuthContext';
import { useTheme } from 'src/shared/theme/ThemeProvider';

import AvatarDropdown from './AvatarDropdown';
import SafeAreaHeader from './SafeAreaHeader';

const Header = () => {
  const { user } = useAuth();
  const { componentStyles, theme } = useTheme();
  const styles = componentStyles.header;

  return (
    <SafeAreaHeader>
      <View style={styles.container}>
        <View style={styles.left}>
          <FontAwesome5 name="dumbbell" size={20} color={theme.colors.accentStart} />
          <Text style={styles.title}>GymBuddy</Text>
        </View>

        {user && (
          <View style={styles.right}>
            <TouchableOpacity style={styles.notification}>
              <MaterialIcons
                name="notifications-none"
                size={24}
                color={theme.colors.textSecondary}
              />
              <View style={styles.dot} />
            </TouchableOpacity>
            <View style={styles.avatar}>
              <AvatarDropdown />
            </View>
          </View>
        )}
      </View>
    </SafeAreaHeader>
  );
};

export default Header;
