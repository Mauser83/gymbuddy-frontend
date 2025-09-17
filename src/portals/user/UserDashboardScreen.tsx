import { useQuery } from '@apollo/client';
import React from 'react';
import { View, Pressable } from 'react-native';
import { useNavigate } from 'react-router-native';

import { useAuth } from 'src/features/auth/context/AuthContext';
import { GET_ACTIVE_WORKOUT_SESSION } from 'src/features/workout-sessions/graphql/userWorkouts.graphql';
import Card from 'src/shared/components/Card';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import Title from 'src/shared/components/Title';
import { spacing } from 'src/shared/theme/tokens';

export default function UserDashboardScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data } = useQuery(GET_ACTIVE_WORKOUT_SESSION, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  const activeSession = data?.activeWorkoutSession;

  return (
    <ScreenLayout scroll>
      <Title text={`Welcome back${user?.username ? `, ${user.username}` : ''}`} />

      <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
        {activeSession ? (
          <Pressable onPress={() => navigate(`/active-session/${activeSession.id}`)}>
            <Card title="Continue Workout" showChevron />
          </Pressable>
        ) : (
          <Pressable onPress={() => navigate('/user/log-exercise')}>
            <Card title="Log Exercise" showChevron />
          </Pressable>
        )}

        <Pressable onPress={() => navigate('/user/my-plans')}>
          <Card title="My Plans" showChevron />
        </Pressable>

        <Pressable onPress={() => navigate('/user/progress')}>
          <Card title="Progress" showChevron />
        </Pressable>

        <Pressable onPress={() => navigate('/workout-session')}>
          <Card title="Workout History" showChevron />
        </Pressable>

        <Pressable onPress={() => navigate('/user/exercise-library')}>
          <Card title="Browse Exercises" showChevron />
        </Pressable>

        <Pressable onPress={() => navigate('/user/recognize-equipment')}>
          <Card title="Recognize Equipment" showChevron />
        </Pressable>
      </View>
    </ScreenLayout>
  );
}
