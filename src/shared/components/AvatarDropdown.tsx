import React, { useRef, useState } from 'react';
import { Text, Pressable, StyleSheet, Animated, Image, Platform } from 'react-native';
import { Portal } from 'react-native-portalize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigate } from 'react-router-native';

import { useAuth } from 'src/features/auth/context/AuthContext';
import { useTheme } from 'src/shared/theme/ThemeProvider';

const AvatarDropdown = () => {
  const insets = useSafeAreaInsets();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const { componentStyles } = useTheme();
  const styles = componentStyles.avatarDropdown;

  const [visible, setVisible] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const hasMultipleRoles = (() => {
    if (!user) return false;
    const roles = ['user'];
    if (user.userRole === 'PERSONAL_TRAINER') roles.push('trainer');
    if (user.appRole === 'ADMIN' || user.appRole === 'MODERATOR') roles.push('admin');
    if (user.gymManagementRoles && user.gymManagementRoles.length > 0) roles.push('gym-manager');
    return roles.length > 1;
  })();

  const openDropdown = () => {
    setVisible(true);
    Animated.timing(dropdownAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setVisible(false);
    });
  };

  const toggleDropdown = () => (visible ? closeDropdown() : openDropdown());

  const handleLogout = () => {
    console.log('AvatarDropdown: logout selected');
    logout();
    closeDropdown();
  };

  const handleProfile = () => {
    navigate('/profile');
    closeDropdown();
  };

  const handleSwitchRole = () => {
    navigate('/select-role');
    closeDropdown();
  };

  return (
    <>
      <Pressable onPress={toggleDropdown}>
        <Image
          source={{
            uri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg',
          }}
          style={styles.avatar}
        />
      </Pressable>

      <Portal>
        {visible && (
          <>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={closeDropdown}
              pointerEvents="auto"
            />
            <Animated.View
              pointerEvents="auto"
              style={[
                styles.dropdown,
                {
                  top: insets.top + 60,
                  opacity: dropdownAnim,
                  transform: [
                    {
                      translateY: dropdownAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Pressable style={styles.item} onPress={handleProfile}>
                <Text style={styles.text}>👤 View Profile</Text>
              </Pressable>
              {hasMultipleRoles && (
                <Pressable style={styles.item} onPress={handleSwitchRole}>
                  <Text style={styles.text}>🔁 Switch Role</Text>
                </Pressable>
              )}
              <Pressable style={styles.item} onPress={handleLogout}>
                <Text style={styles.text}>🚪 Logout</Text>
              </Pressable>
            </Animated.View>
          </>
        )}
      </Portal>
    </>
  );
};

export default AvatarDropdown;
