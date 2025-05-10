// Footer.tsx
import React from 'react';
import {TouchableOpacity, View, Text, StyleSheet} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome5';
import SafeAreaFooter from './SafeAreaFooter';
import {useAuth} from '../../modules/auth/context/AuthContext';
import {useNavigate, useLocation} from 'react-router-native';
import {useQuery} from '@apollo/client';
import {GET_PENDING_GYMS} from '../../modules/gym/graphql/gym.queries';

const Footer = () => {
  const {user} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {data} = useQuery(GET_PENDING_GYMS, {
    skip: !user || (user.appRole !== 'ADMIN' && user.appRole !== 'MODERATOR'),
    fetchPolicy: 'cache-first',
  });

  const pendingCount = data?.pendingGyms?.length ?? 0;
  const isActive = (path: string) => location.pathname === path;

  return (
    <SafeAreaFooter>
      <View
        style={[
          styles.container,
          user ? styles.authContainer : styles.guestContainer,
        ]}>
        {!user && (
          <TouchableOpacity onPress={() => navigate('/')}>
            <FontAwesome
              name="home"
              size={24}
              color={isActive('/') ? '#f97316' : '#9ca3af'}
            />
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
                  color={isActive('/admin') ? '#f97316' : '#9ca3af'}
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
                  color={isActive('/gym-admin') ? '#f97316' : '#9ca3af'}
                />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => navigate('/gyms')}>
              <FontAwesome
                name="building"
                size={24}
                color={isActive('/gyms') ? '#f97316' : '#9ca3af'}
              />
            </TouchableOpacity>

            {(user.appRole === 'ADMIN' || user.appRole === 'MODERATOR') && (
              <TouchableOpacity onPress={() => navigate('/users')}>
                <FontAwesome
                  name="users"
                  size={24}
                  color={isActive('/users') ? '#f97316' : '#9ca3af'}
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

// File-specific styles
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  authContainer: {
    justifyContent: 'space-around',
    paddingHorizontal: 0,
  },
  guestContainer: {
    justifyContent: 'flex-start',
    paddingHorizontal: 33,
    gap: 32,
  },
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#ef4444',
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
