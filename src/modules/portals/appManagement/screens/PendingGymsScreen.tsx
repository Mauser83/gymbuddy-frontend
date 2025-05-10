import React from 'react';
import {
  ScrollView,
  ActivityIndicator,
  Alert,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-native';

import { GET_PENDING_GYMS } from '../../../gym/graphql/gym.queries';
import { APPROVE_GYM } from '../../../gym/graphql/gym.mutations';

const PendingGymsScreen = () => {
  const navigate = useNavigate();

  const { data, loading } = useQuery(GET_PENDING_GYMS, {
    fetchPolicy: 'cache-and-network',
  });

  const [approveGym, { loading: approving }] = useMutation(APPROVE_GYM);

  const handleApprove = async (gymId: number) => {
    try {
      await approveGym({
        variables: { gymId },
        update(cache) {
          const existing = cache.readQuery<{ pendingGyms: any[] }>({
            query: GET_PENDING_GYMS,
          });

          if (!existing) return;

          cache.writeQuery({
            query: GET_PENDING_GYMS,
            data: {
              pendingGyms: existing.pendingGyms.filter(g => g.id !== gymId),
            },
          });
        },
      });

      Alert.alert('✅ Approved', 'Gym has been approved.');
    } catch (err) {
      console.error(err);
      Alert.alert('❌ Error', 'Failed to approve gym.');
    }
  };

  const pendingGyms = data?.pendingGyms ?? [];

  if (loading) {
    return (
      <LinearGradient colors={['#0f172a', '#1f2937']} style={styles.gradient}>
        <View style={styles.centered}>
          <View style={styles.glassCard}>
            <Text style={styles.header}>Loading pending gyms...</Text>
            <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 16 }} />
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1f2937']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.glassCard}>
          <Text style={styles.header}>Pending Gym Approvals</Text>
        </View>

        {pendingGyms.length === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>🎉 No pending gyms</Text>
          </View>
        ) : (
          pendingGyms.map((gym: any) => (
            <View style={styles.glassCard} key={gym.id}>
              <Text style={styles.fieldTitle}>🏋️ Gym Name:</Text>
              <Text style={styles.fieldText}>{gym.name}</Text>

              <Text style={styles.fieldTitle}>📍 Location:</Text>
              <Text style={styles.fieldText}>
                {gym.city}, {gym.country}
              </Text>

              {gym.creator && (
                <>
                  <Text style={styles.fieldTitle}>👤 Submitted By:</Text>
                  <Text style={styles.fieldText}>
                    {gym.creator.username} ({gym.creator.email})
                  </Text>
                </>
              )}

              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => handleApprove(gym.id)}
                disabled={approving}
              >
                <Text style={styles.approveButtonText}>
                  {approving ? 'Approving...' : 'Approve'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default PendingGymsScreen;

// File-specific styles
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scroll: {
    padding: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 8,
  },
  fieldText: {
    fontSize: 16,
    color: '#f9fafb',
    marginBottom: 8,
  },
  approveButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  approveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  noResults: {
    marginTop: 32,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#9ca3af',
    fontSize: 16,
  },
});
