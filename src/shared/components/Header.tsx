// Header.tsx
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {FontAwesome5} from '@expo/vector-icons';
import SafeAreaHeader from './SafeAreaHeader';
import {useAuth} from '../../modules/auth/context/AuthContext';
import AvatarDropdown from './AvatarDropdown';

const Header = () => {
  const {user} = useAuth();

  return (
    <SafeAreaHeader>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <FontAwesome5 name="dumbbell" size={20} color="#f97316" />
          <Text style={styles.title}>GymBuddy</Text>
        </View>

        {user && (
          <View style={styles.rightSection}>
            <TouchableOpacity style={styles.notificationWrapper}>
              <MaterialIcons name="notifications-none" size={24} color="#9ca3af" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <View style={styles.avatarWrapper}>
              <AvatarDropdown />
            </View>
          </View>
        )}
      </View>
    </SafeAreaHeader>
  );
};

export default Header;

// File-specific styles
const styles = StyleSheet.create({
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#78350f',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
    minHeight: 61, // ✅ Ensures consistent height (tweak if needed)
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  notificationWrapper: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f97316',
  },
  avatarWrapper: {
    position: 'relative',
  },
});
