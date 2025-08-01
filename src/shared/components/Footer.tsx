// Footer.tsx
import React from 'react';
import {TouchableOpacity, View, Text} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome5';
import SafeAreaFooter from './SafeAreaFooter';
import {useAuth} from 'features/auth/context/AuthContext';
import {useRoleContext} from 'features/auth/context/RoleContext';
import {useNavigate, useLocation} from 'react-router-native';
import {useQuery} from '@apollo/client';
import {GET_PENDING_GYMS} from 'features/gyms/graphql/gym.queries';
import {useTheme} from 'shared/theme/ThemeProvider';

const Footer = () => {
  const {user} = useAuth();
  const activeRoleContext = useRoleContext();
  const navigate = useNavigate();
  const location = useLocation();
  const {theme, componentStyles} = useTheme();
  const styles = componentStyles.footer;

  const {data} = useQuery(GET_PENDING_GYMS, {
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
    badge,
  }: {
    to: string;
    icon: string;
    badge?: number;
  }) => (
    <TouchableOpacity onPress={() => navigate(to)} style={styles.iconWrapper}>
      <FontAwesome name={icon} size={24} color={iconColor(to)} />
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
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
                <FooterButton to="/user" icon="tachometer-alt" />
                <FooterButton to="/user/log-exercise" icon="dumbbell" />
                <FooterButton to="/user/my-plans" icon="clipboard" />
                <FooterButton to="/user/progress" icon="chart-line" />
                <FooterButton to="/user/exercise-library" icon="book" />
                <FooterButton to="/gyms" icon="building" />
              </>
            )}

            {activeRoleContext?.role === 'gym-manager' && (
              <>
                <FooterButton to="/gym-admin" icon="tachometer-alt" />
                <FooterButton to="/gyms" icon="building" />
              </>
            )}

            {activeRoleContext?.role === 'trainer' && (
              <>
                <FooterButton to="/trainer" icon="tachometer-alt" />
                <FooterButton to="/trainer/clients" icon="users" />
              </>
            )}

            {activeRoleContext?.role === 'admin' && (
              <>
                <FooterButton
                  to="/admin"
                  icon="tachometer-alt"
                  badge={pendingCount > 0 ? pendingCount : undefined}
                />
                <FooterButton to="/equipment" icon="tools" />
                <FooterButton to="/exercise" icon="dumbbell" />
                <FooterButton to="/workoutplan/builder" icon="clipboard-list" />
                <FooterButton to="/users" icon="users" />
                <FooterButton to="/gyms" icon="building" />
              </>
            )}
          </>
        )}
      </View>
    </SafeAreaFooter>
  );
};

export default Footer;