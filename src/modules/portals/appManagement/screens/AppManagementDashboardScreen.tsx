import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigate } from 'react-router-native';
import { useQuery, useSubscription } from '@apollo/client';
import { GET_PENDING_GYMS } from '../../../gym/graphql/gym.queries';
import { GYM_FRAGMENT } from 'modules/gym/graphql/gym.fragments';
import { GYM_CREATED_SUBSCRIPTION, GYM_APPROVED_SUBSCRIPTION } from '../../../gym/graphql/gym.subscriptions';

const AppDashboardScreen = () => {
  const navigate = useNavigate();
  const { data, loading } = useQuery(GET_PENDING_GYMS, {
    fetchPolicy: 'cache-first',
  });

  const pendingCount = data?.pendingGyms?.length || 0;

  useSubscription(GYM_CREATED_SUBSCRIPTION, {
    onData: ({ client, data }) => {
      const newGym = data.data?.gymCreated;
      if (!newGym) return;

      client.cache.updateQuery({ query: GET_PENDING_GYMS }, existing => {
        if (!existing?.pendingGyms) return existing;
        return {
          ...existing,
          pendingGyms: [newGym, ...existing.pendingGyms],
        };
      });
    },
  });

  useSubscription(GYM_APPROVED_SUBSCRIPTION, {
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

  return (
    <LinearGradient colors={['#0f172a', '#1f2937']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.glassCard}>
          <Text style={styles.headerText}>📊 Admin Dashboard</Text>
        </View>

        <View style={styles.glassCard}>
          <Text style={styles.fieldTitle}>📝 Pending Gyms</Text>
          <Text style={styles.fieldText}>
            {pendingCount} gyms waiting for approval
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigate('/pending-gyms')}
          >
            <Text style={styles.buttonText}>Review Pending Gyms</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default AppDashboardScreen;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    padding: 24,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f9fafb',
    textAlign: 'center',
  },
  fieldTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#facc15',
    marginBottom: 6,
  },
  fieldText: {
    fontSize: 16,
    color: '#f9fafb',
    marginBottom: 12,
  },
  button: {
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
