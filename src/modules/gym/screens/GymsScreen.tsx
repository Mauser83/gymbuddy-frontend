import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useSubscription } from '@apollo/client';
import { useAuth } from '../../auth/context/AuthContext';
import { useNavigate } from 'react-router-native';
import { GET_GYMS } from '../graphql/gym.queries';
import { GYM_APPROVED_SUBSCRIPTION } from '../graphql/gym.subscriptions';
import { GYM_FRAGMENT } from '../graphql/gym.fragments';
import { Gym } from 'modules/gym/types/gym';

const GymsScreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [gyms, setGyms] = useState<Gym[]>([]);

  const { loading, data, refetch } = useQuery(GET_GYMS, {
    fetchPolicy: 'cache-and-network',
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

  useEffect(() => {
    const timer = setTimeout(() => {
      refetch({ search: searchQuery.length > 0 ? searchQuery : undefined });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (data?.gyms) {
      setGyms(data.gyms);
    }
  }, [data]);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user]);

  if (loading) {
    return (
      <LinearGradient colors={['#0f172a', '#1f2937']} style={styles.gradient}>
        <View style={styles.centered}>
          <View style={styles.glassCard}>
            <Text style={styles.header}>Loading...</Text>
            <ActivityIndicator size="large" color="#f97316" style={{ marginTop: 16 }} />
          </View>
        </View>
      </LinearGradient>
    );
  }

  const NoResultsFound = () => (
    <View style={styles.noResults}>
      <Text style={styles.noResultsText}>😕 No gyms found</Text>
    </View>
  );

  return (
    <LinearGradient colors={['#0f172a', '#1f2937']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.glassCard}>
          <Text style={styles.header}>Gyms</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search by name or location"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery('')}>
              <Text style={styles.clearButtonText}>✖</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.createButton} onPress={() => navigate('/gyms/create')}>
          <Text style={styles.createButtonText}>➕ Create New Gym</Text>
        </TouchableOpacity>

        {(gyms?.length ?? 0) === 0 ? (
          <NoResultsFound />
        ) : (
          gyms.map((gym) => (
            <TouchableOpacity key={gym.id} onPress={() => navigate(`/gyms/${gym.id}`)}>
              <View style={styles.glassCard}>
                <Text style={styles.fieldTitle}>📍 Name:</Text>
                <Text style={styles.fieldText}>{gym.name}</Text>

                <Text style={styles.fieldTitle}>🌍 Country:</Text>
                <Text style={styles.fieldText}>{gym.country || 'Unknown'}</Text>

                <Text style={styles.fieldTitle}>🏙️ City:</Text>
                <Text style={styles.fieldText}>{gym.city || 'Unknown'}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default GymsScreen;

// Styles
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
  },
  fieldText: {
    fontSize: 16,
    color: '#f9fafb',
    marginBottom: 8,
  },
  searchContainer: {
    position: 'relative',
    marginVertical: 16,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 40,
    color: '#f9fafb',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 14,
    height: 24,
    width: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#f97316',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
