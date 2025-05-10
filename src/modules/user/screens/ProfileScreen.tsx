import React from 'react';
import {
  ScrollView,
  Platform,
  View,
  Text,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useAuth} from '../../auth/context/AuthContext';

const ProfileScreen = () => {
  const {user} = useAuth();

  if (!user) {
    return (
      <LinearGradient colors={['#0f172a', '#1f2937']} style={styles.gradient}>
        <View style={styles.centered}>
          <View style={styles.glassCard}>
            <Text style={styles.title}>⚠️ No user data</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1f2937']} style={styles.gradient}>
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <View style={styles.glassCard}>
              <Text style={styles.title}>👤 My Profile</Text>

              <Text style={styles.fieldTitle}>Email:</Text>
              <Text style={styles.fieldText}>{user.email}</Text>

              <Text style={styles.fieldTitle}>Username:</Text>
              <Text style={styles.fieldText}>{user.username}</Text>

              {user.appRole && (
                <>
                  <Text style={styles.fieldTitle}>App Role:</Text>
                  <View style={[styles.pill, {backgroundColor: '#ef4444'}]}>
                    <Text style={styles.pillText}>{user.appRole}</Text>
                  </View>
                </>
              )}

              <Text style={styles.fieldTitle}>User Role:</Text>
              <View style={[styles.pill, {backgroundColor: '#f97316'}]}>
                <Text style={styles.pillText}>{user.userRole}</Text>
              </View>

              <Text style={styles.fieldTitle}>Joined:</Text>
              <Text style={styles.fieldText}>
                {new Date(Number(user.createdAt)).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>

              {user.gymManagementRoles &&
                user.gymManagementRoles?.length > 0 && (
                  <>
                    <Text style={[styles.fieldTitle, {marginTop: 12}]}>
                      🏋️‍♂️ Gym Roles:
                    </Text>
                    {user.gymManagementRoles.map((gr, idx) => (
                      <Text style={styles.fieldText} key={idx}>
                        - {gr.gym.name}: {gr.role.replace('_', ' ')}
                      </Text>
                    ))}
                  </>
                )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default ProfileScreen;

// File-specific styles
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
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
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f9fafb',
    textAlign: 'center',
    marginBottom: 20,
  },
  fieldTitle: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
    marginTop: 12,
  },
  fieldText: {
    fontSize: 16,
    color: '#f9fafb',
  },
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  pillText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
});
