import React, { useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useParams, useNavigate } from 'react-router-native';
import { useQuery } from '@apollo/client';
import { useAuth } from '../../../auth/context/AuthContext';
import { GET_GYM_BY_ID } from '../../../gym/graphql/gym.queries';
import { GymRole } from 'modules/gym/types/gym';

const GymManagementScreen = () => {
  const { gymId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, loading } = useQuery(GET_GYM_BY_ID, {
    variables: { id: gymId },
  });

  const gym = data?.gymById;

  useEffect(() => {
    if (!user) navigate('/');
  }, [user]);

  if (loading || !gym) {
    return (
      <LinearGradient colors={['#0f172a', '#1f2937']} style={styles.gradient}>
        <View style={styles.centered}>
          <Text style={styles.fieldText}>
            {loading ? 'Loading gym...' : '❌ Gym not found'}
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1f2937']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Gym Header */}
        <View style={styles.glassCard}>
          <Text style={styles.header}>{gym.name}</Text>
          {!gym.isApproved && (
            <Text style={styles.pendingText}>⏳ Pending Approval</Text>
          )}
        </View>

        {/* Gym Info */}
        <View style={styles.glassCard}>
          <Text style={styles.sectionHeader}>🏢 Gym Information</Text>

          <Text style={styles.fieldTitle}>📝 Description:</Text>
          <Text style={styles.fieldText}>{gym.description || 'Not provided'}</Text>

          <Text style={styles.fieldTitle}>📍 Address:</Text>
          <Text style={styles.fieldText}>{gym.address || 'Not provided'}</Text>

          <Text style={styles.fieldTitle}>📞 Phone:</Text>
          <Text style={styles.fieldText}>{gym.phone || 'Not provided'}</Text>

          <Text style={styles.fieldTitle}>✉️ Email:</Text>
          <Text style={styles.fieldText}>{gym.email || 'Not provided'}</Text>

          <Text style={styles.fieldTitle}>🔗 Website:</Text>
          <Text style={styles.fieldText}>{gym.websiteUrl || 'Not provided'}</Text>

          <TouchableOpacity
            style={[styles.itemButton, { marginTop: 16 }]}
            onPress={() => navigate(`/gym-admin/gyms/${gymId}/edit`)}
          >
            <Text style={styles.fieldText}>📝 Edit Gym Info</Text>
          </TouchableOpacity>
        </View>

        {/* Staff Info */}
<View style={styles.glassCard}>
  <Text style={styles.sectionHeader}>🧑‍💼 Staff</Text>

  {/* Group staff by role */}
  {['GYM_ADMIN', 'GYM_MODERATOR'].map((roleKey) => {
    const group = gym.gymRoles.filter((r: GymRole) => r.role === roleKey);

    if (group.length === 0) return null;

    return (
      <View key={roleKey} style={{ marginBottom: 16 }}>
        <Text style={[styles.fieldTitle, { marginTop: 12 }]}>
          {roleKey === 'GYM_ADMIN' ? '👑 Admins:' : '🧑 Moderators:'}
        </Text>
        {group.map(({ user }: GymRole) => (
          <Text key={user.id} style={styles.fieldText}>
            {user.username}
          </Text>
        ))}
      </View>
    );
  })}

  <TouchableOpacity
    style={[styles.itemButton, { marginTop: 12 }]}
    onPress={() => navigate(`/gym-admin/gyms/${gymId}/staff`)}
  >
    <Text style={styles.fieldText}>⚙️ Manage Staff</Text>
  </TouchableOpacity>
</View>
      </ScrollView>
    </LinearGradient>
  );
};

export default GymManagementScreen;

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
  pendingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#fcd34d',
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 12,
  },
  fieldTitle: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
    marginTop: 8,
  },
  fieldText: {
    fontSize: 16,
    color: '#f9fafb',
    marginBottom: 4,
  },
  itemButton: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    marginBottom: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});