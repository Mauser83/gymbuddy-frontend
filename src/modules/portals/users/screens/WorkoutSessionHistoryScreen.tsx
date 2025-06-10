import React from 'react';
import {View, FlatList, TouchableOpacity} from 'react-native';
import {useQuery} from '@apollo/client';
import {useNavigate} from 'react-router-native';
import {format} from 'date-fns';

import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Card from 'shared/components/Card';
import LoadingSpinner from 'shared/components/LoadingSpinner';
import ErrorMessage from 'shared/components/ErrorMessage';
import {useAuth} from 'modules/auth/context/AuthContext';
import {useTheme} from 'shared/theme/ThemeProvider';

import { GET_WORKOUT_SESSIONS_BY_USER } from '../graphql/userWorkouts.graphql';

type WorkoutSessionPreview = {
  id: number;
  startedAt: string;
  endedAt?: string;
  notes?: string;
  workoutPlan?: {
    id: number;
    name: string;
  };
  gym?: {
    id: number;
    name: string;
  };
};

const WorkoutSessionHistoryScreen = () => {
  const navigate = useNavigate();
  const {user} = useAuth();
  const {componentStyles} = useTheme();

  const {data, loading, error} = useQuery(GET_WORKOUT_SESSIONS_BY_USER, {
    variables: {userId: user?.id},
    skip: !user?.id,
  });
  
  const handleSessionPress = (sessionId: number) => {
    navigate(`/workout-session/${sessionId}`);
  };

  const renderSessionCard = ({item}: {item: WorkoutSessionPreview}) => {
    const {id, startedAt, endedAt, workoutPlan, gym} = item;

    const parsedStart = startedAt ? new Date(Number(startedAt)) : null;
    const parsedEnd = endedAt ? new Date(Number(endedAt)) : null;

    const startDate =
      parsedStart && !isNaN(parsedStart.getTime())
        ? format(parsedStart, 'MMM d, yyyy')
        : 'Unknown Date';

    let duration = 'In Progress';
    if (
      parsedStart &&
      parsedEnd &&
      !isNaN(parsedStart.getTime()) &&
      !isNaN(parsedEnd.getTime())
    ) {
      const durationMinutes = Math.round(
        (parsedEnd.getTime() - parsedStart.getTime()) / 60000,
      );
      duration = durationMinutes <= 180 ? `${durationMinutes} min` : '';
    }

    const title = workoutPlan?.name ?? 'Ad-hoc Session';
    const subtitle = [startDate, gym?.name || 'No Gym', duration]
      .filter(Boolean)
      .join(' • ');

    return (
      <TouchableOpacity onPress={() => handleSessionPress(id)}>
        <Card title={title} text={subtitle} style={{marginBottom: 12}} />
      </TouchableOpacity>
    );
  };

  return (
    <ScreenLayout>
      <Title text="Workout History" align="center" />

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message="Failed to load sessions." />}

      {!loading && !error && (
        <FlatList
          data={data?.workoutSessionsByUser || []}
          keyExtractor={item => item.id.toString()}
          renderItem={renderSessionCard}
          ListEmptyComponent={<ErrorMessage message="No sessions found." />}
        />
      )}
    </ScreenLayout>
  );
};

export default WorkoutSessionHistoryScreen;
