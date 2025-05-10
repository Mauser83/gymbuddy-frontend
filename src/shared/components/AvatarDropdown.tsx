import React, {useRef, useState} from 'react';
import {
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Image,
  Platform,
} from 'react-native';
import {useAuth} from '../../modules/auth/context/AuthContext';
import {Portal} from 'react-native-portalize';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigate} from 'react-router-native';
import {useTheme} from 'shared/theme/ThemeProvider';


const AvatarDropdown = () => {
  const insets = useSafeAreaInsets();
  const navigate = useNavigate();
  const {logout} = useAuth();

  const {componentStyles} = useTheme();
const styles = componentStyles.avatarDropdown;

  const [visible, setVisible] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

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
    logout();
    closeDropdown();
  };

  const handleProfile = () => {
    navigate('/profile');
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