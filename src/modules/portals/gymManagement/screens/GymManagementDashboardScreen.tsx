import React, { useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigate } from 'react-router-native';
import { useAuth } from '../../../auth/context/AuthContext';
import { GymRole } from 'modules/gym/types/gym';

const GymAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const isGymManager =
      user?.gymManagementRoles?.some(
        (role: GymRole) =>
          role.role === 'GYM_ADMIN' || role.role === 'GYM_MODERATOR',
      ) ?? false;

    const isAppAdmin = user?.appRole === 'ADMIN' || user?.appRole === 'MODERATOR';

    if (!user || (!isGymManager && !isAppAdmin)) {
      navigate('/');
    }
  }, [user]);

  const gyms = user?.gymManagementRoles?.map((r) => r.gym) ?? [];

  return (
    <LinearGradient colors={['#0f172a', '#1f2937']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.glassCard}>
          <Text style={styles.header}>Gym Admin Dashboard</Text>
        </View>

        {/* My Gyms Section */}
        <View style={styles.glassCard}>
          <Text style={styles.sectionHeader}>🏢 My Gyms</Text>
          {gyms.length === 0 ? (
            <Text style={styles.fieldText}>No gyms assigned yet.</Text>
          ) : (
            gyms.map((gym) => (
              <TouchableOpacity
                key={gym.id}
                style={styles.itemButton}
                onPress={() => navigate(`/gym-admin/gyms/${gym.id}`)}
              >
                <Text style={styles.fieldText}>
                  {gym.name} {gym.isApproved ? '' : '(Pending)'}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default GymAdminDashboard;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scroll: {
    padding: 24,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f9fafb',
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 12,
  },
  fieldText: {
    fontSize: 16,
    color: '#f9fafb',
  },
  itemButton: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    marginBottom: 8,
  },
});
