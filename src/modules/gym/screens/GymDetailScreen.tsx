import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useParams, useNavigate } from 'react-router-native';
import { useQuery, useSubscription } from '@apollo/client';
import { GET_GYM_BY_ID } from '../graphql/gym.queries';
import { GYM_APPROVED_SUBSCRIPTION } from '../graphql/gym.subscriptions';
import { GYM_FRAGMENT } from 'modules/gym/graphql/gym.fragments';
import { Gym } from 'modules/gym/types/gym';
import { useAuth } from 'modules/auth/context/AuthContext';

const GymDetailScreen = () => {
  const { gymId } = useParams<{ gymId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, loading, error } = useQuery(GET_GYM_BY_ID, {
    variables: { id: gymId },
    fetchPolicy: 'cache-first',
  });

  const gym = data?.gymById;

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
  
    if (!gym) return;
  
    if (gym.isApproved) return; // approved gyms are public to logged-in users
  
    const isGymAdmin = gym.gymRoles?.some(
      (role: Gym['gymRoles'][number]) => role.role === 'GYM_ADMIN' && String(role.user.id) === user.id
    );
  
    if (!isGymAdmin) {
      navigate('/');
    }
  }, [user, gym]);

  useSubscription(GYM_APPROVED_SUBSCRIPTION, {
  skip: gym?.isApproved, // don't subscribe if already approved
  onData: ({ client, data }) => {
    const updatedGym = data.data?.gymApproved;
    if (!updatedGym) return;

    client.writeFragment({
      id: `Gym:${updatedGym.id}`,
      fragment: GYM_FRAGMENT,
      data: updatedGym,
    });
  },
});

  if (loading) {
    return (
      <LinearGradient colors={['#0f172a', '#1f2937']} style={styles.gradient}>
        <View style={styles.centered}>
          <View style={styles.glassCard}>
            <Text style={styles.header}>Loading gym details...</Text>
            <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 16 }} />
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (error || !gym) {
    return (
      <LinearGradient colors={['#0f172a', '#1f2937']} style={styles.gradient}>
        <View style={styles.centered}>
          <View style={styles.glassCard}>
            <Text style={styles.header}>❌ Failed to load gym</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1f2937']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.glassCard}>
          <Text style={styles.header}>{gym.name}</Text>
  
          {gym.description && (
            <>
              <Text style={styles.fieldTitle}>📝 Description:</Text>
              <Text style={styles.fieldText}>{gym.description}</Text>
            </>
          )}
  
          {gym.address && (
            <>
              <Text style={styles.fieldTitle}>📍 Address:</Text>
              <Text style={styles.fieldText}>{gym.address}</Text>
            </>
          )}
  
          {gym.city && (
            <>
              <Text style={styles.fieldTitle}>🏙️ City:</Text>
              <Text style={styles.fieldText}>{gym.city}</Text>
            </>
          )}
  
          {gym.country && (
            <>
              <Text style={styles.fieldTitle}>🌍 Country:</Text>
              <Text style={styles.fieldText}>{gym.country}</Text>
            </>
          )}

  
          {gym.equipment?.length > 0 && (
            <>
              <Text style={styles.fieldTitle}>🏋️ Equipment Count:</Text>
              <Text style={styles.fieldText}>{gym.equipment.length}</Text>
            </>
          )}
  
          {gym.trainers?.length > 0 && (
            <>
              <Text style={styles.fieldTitle}>🧑‍🏫 Trainers Count:</Text>
              <Text style={styles.fieldText}>{gym.trainers.length}</Text>
            </>
          )}
            {gym.gymRoles?.length > 0 ? (
  <>
    <Text style={styles.fieldTitle}>🛡️ Roles:</Text>

    {gym.gymRoles.filter((r: Gym['gymRoles'][number]) => r.role === 'GYM_ADMIN').length > 0 && (
      <>
        <Text style={[styles.fieldTitle, { marginTop: 8 }]}>👑 Admins:</Text>
        <Text style={styles.fieldText}>
          {gym.gymRoles
            .filter((r: Gym['gymRoles'][number]) => r.role === 'GYM_ADMIN')
            .map((r: Gym['gymRoles'][number]) => r.user.username)
            .join(', ')}
        </Text>
      </>
    )}

    {gym.gymRoles.filter((r: Gym['gymRoles'][number]) => r.role === 'GYM_MODERATOR').length > 0 && (
      <>
        <Text style={[styles.fieldTitle, { marginTop: 8 }]}>🛡️ Moderators:</Text>
        <Text style={styles.fieldText}>
          {gym.gymRoles
            .filter((r: Gym['gymRoles'][number]) => r.role === 'GYM_MODERATOR')
            .map((r: Gym['gymRoles'][number]) => r.user.username)
            .join(', ')}
        </Text>
      </>
    )}
  </>
) : (
  <>
    <Text style={styles.fieldTitle}>🛡️ Roles:</Text>
    <Text style={styles.fieldText}>No roles assigned</Text>
  </>
)}
        </View>
      </ScrollView>
    </LinearGradient>
  )
};

export default GymDetailScreen;

// File-specific styles
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollContent: {
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
  fieldTitle: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
    marginTop: 16,
  },
  fieldText: {
    fontSize: 16,
    color: '#f9fafb',
    marginBottom: 8,
  },
});
