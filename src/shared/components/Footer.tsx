// Footer.tsx
import { useQuery } from '@apollo/client';
import FontAwesome from '@expo/vector-icons/FontAwesome5';
import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { useNavigate, useLocation } from 'react-router-native';

import { useAuth } from 'features/auth/context/AuthContext';
import { useRoleContext } from 'features/auth/context/RoleContext';
import { GET_PENDING_GYMS } from 'features/gyms/graphql/gym.queries';
import { useTheme } from 'shared/theme/ThemeProvider';

import SafeAreaFooter from './SafeAreaFooter';

const Footer = () => {
  const { user } = useAuth();
  const activeRoleContext = useRoleContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, componentStyles } = useTheme();
  const styles = componentStyles.footer;

  const { data } = useQuery(GET_PENDING_GYMS, {
    skip: !user || activeRoleContext?.role !== 'admin',
    fetchPolicy: 'cache-first',
  });

  const pendingCount = data?.pendingGyms?.length ?? 0;
  const isActive = (path: string) => location.pathname === path;
  const iconColor = (path: string) =>
    isActive(path) ? theme.colors.accentStart : theme.colors.textSecondary;

  const FooterButton = ({
    to,
    icon,
    label,
    badge,
  }: {
    to: string;
    icon: string;
    label: string;
    badge?: number;
  }) => (
    <TouchableOpacity
      onPress={() => navigate(to)}
      style={[styles.iconWrapper, { alignItems: 'center' }]}
    >
      <FontAwesome name={icon} size={24} color={iconColor(to)} />
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Text style={[styles.iconLabel, { color: iconColor(to) }]}>{label}</Text>
    </TouchableOpacity>
  );

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
            {activeRoleContext?.role === 'user' && (
              <>
                <FooterButton to="/user" icon="tachometer-alt" label="Home" />
                <FooterButton to="/user/log-exercise" icon="dumbbell" label="Log" />
                <FooterButton to="/user/my-plans" icon="clipboard" label="Plans" />
                <FooterButton to="/user/progress" icon="chart-line" label="Progress" />
                <FooterButton to="/user/exercise-library" icon="book" label="Exercises" />
                <FooterButton to="/gyms" icon="building" label="Gyms" />
              </>
            )}

            {activeRoleContext?.role === 'gym-manager' && (
              <>
                <FooterButton to="/gym-admin" icon="tachometer-alt" label="Home" />
                <FooterButton to="/gyms" icon="building" label="Gyms" />
              </>
            )}

            {activeRoleContext?.role === 'trainer' && (
              <>
                <FooterButton to="/trainer" icon="tachometer-alt" label="Home" />
                <FooterButton to="/trainer/clients" icon="users" label="Clients" />
              </>
            )}

            {activeRoleContext?.role === 'admin' && (
              <>
                <FooterButton
                  to="/admin"
                  icon="tachometer-alt"
                  label="Home"
                  badge={pendingCount > 0 ? pendingCount : undefined}
                />
                <FooterButton to="/equipment" icon="tools" label="Equipment" />
                <FooterButton to="/exercise" icon="dumbbell" label="Exercises" />
                <FooterButton to="/users" icon="users" label="Users" />
                <FooterButton to="/gyms" icon="building" label="Gyms" />
              </>
            )}
          </>
        )}
      </View>
    </SafeAreaFooter>
  );
};

export default Footer;
