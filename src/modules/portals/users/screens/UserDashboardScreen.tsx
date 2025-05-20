import React from 'react';
import { View, Pressable } from 'react-native';
import { useAuth } from '../../../auth/context/AuthContext';
import { useNavigate } from 'react-router-native';
import ScreenLayout from '../../../../shared/components/ScreenLayout';
import  Title  from '../../../../shared/components/Title';
import  Card  from '../../../../shared/components/Card';
import { spacing } from '../../../../shared/theme/tokens';

export default function UserDashboardScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <ScreenLayout>
      <Title text={`Welcome back${user?.username ? `, ${user.username}` : ''}`} />

      <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
        <Pressable onPress={() => navigate('/user/my-plans')}>
          <Card title="My Plans" showChevron />
        </Pressable>

        <Pressable onPress={() => navigate('/user/log-exercise')}>
          <Card title="Log Exercise" showChevron />
        </Pressable>

        <Pressable onPress={() => navigate('/user/progress')}>
          <Card title="Progress" showChevron />
        </Pressable>
      </View>
    </ScreenLayout>
  );
}
