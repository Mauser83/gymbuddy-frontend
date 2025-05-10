// Footer.tsx
import React from 'react';
import {TouchableOpacity, View, Text, StyleSheet} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome5';
import SafeAreaFooter from './SafeAreaFooter';
import {useAuth} from '../../modules/auth/context/AuthContext';
import {useNavigate, useLocation} from 'react-router-native';
import {useQuery} from '@apollo/client';
import {GET_PENDING_GYMS} from '../../modules/gym/graphql/gym.queries';
import {useTheme} from 'shared/theme/ThemeProvider';

const Footer = () => {
  const {user} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {theme, componentStyles} = useTheme();
  const styles = componentStyles.footer;

  const {data} = useQuery(GET_PENDING_GYMS, {
    skip: !user || (user.appRole !== 'ADMIN' && user.appRole !== 'MODERATOR'),
    fetchPolicy: 'cache-first',
  });

  const pendingCount = data?.pendingGyms?.length ?? 0;
  const isActive = (path: string) => location.pathname === path;
  const iconColor = (path: string) =>
    isActive(path) ? theme.colors.accentStart : theme.colors.textSecondary;

  return (
    <SafeAreaFooter>
      <View style={[styles.container, user ? styles.authContainer : styles.guestContainer]}>
        {!user && (
          <TouchableOpacity onPress={() => navigate('/')}>
            <FontAwesome name="home" size={24} color={iconColor('/')} />
          </TouchableOpacity>
        )}

        {user && (
          <>
            {(user.appRole === 'ADMIN' || user.appRole === 'MODERATOR') && (
              <TouchableOpacity
                onPress={() => navigate('/admin')}
                style={styles.iconWrapper}>
                <FontAwesome
                  name="tachometer-alt"
                  size={24}
                  color={iconColor('/admin')}
                />
                {pendingCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {(user?.gymManagementRoles?.length ?? 0) > 0 && (
              <TouchableOpacity onPress={() => navigate('/gym-admin')}>
                <FontAwesome
                  name="lightbulb"
                  size={24}
                  color={iconColor('/gym-admin')}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => navigate('/gyms')}>
              <FontAwesome
                name="building"
                size={24}
                color={iconColor('/gyms')}
              />
            </TouchableOpacity>

            {(user.appRole === 'ADMIN' || user.appRole === 'MODERATOR') && (
              <TouchableOpacity onPress={() => navigate('/users')}>
                <FontAwesome
                  name="users"
                  size={24}
                  color={iconColor('/users')}
                />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </SafeAreaFooter>
  );
};

export default Footer;