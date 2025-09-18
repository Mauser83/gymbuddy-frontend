import { useQuery } from '@apollo/client';
import React, { useEffect, useState } from 'react';
import { ScrollView, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

import { useAuth } from 'src/features/auth/context/AuthContext';
import { GET_WORKOUT_SESSIONS_BY_USER } from 'src/features/exercises/graphql/exercise.graphql';
import Card from 'src/shared/components/Card';
import ClickableList from 'src/shared/components/ClickableList';
import DetailField from 'src/shared/components/DetailField';
import NoResults from 'src/shared/components/NoResults';
import OptionModal from 'src/shared/components/OptionModal';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import SelectableField from 'src/shared/components/SelectableField';
import Title from 'src/shared/components/Title';
import { useTheme } from 'src/shared/theme/ThemeProvider';
import { borderRadius, spacing } from 'src/shared/theme/tokens';

const TIMEFRAME_OPTIONS = ['Last 7 Days', 'Last 30 Days'];

const ProgressOverviewScreen = () => {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const [timeframe, setTimeframe] = useState<'Last 7 Days' | 'Last 30 Days'>('Last 7 Days');
  const [showTimeframeModal, setShowTimeframeModal] = useState(false);
  const { user } = useAuth();
  const userId = user?.id;

  const { data } = useQuery(GET_WORKOUT_SESSIONS_BY_USER, {
    variables: { userId },
  });

  const [recentWorkouts, setRecentWorkouts] = useState<
    { id: string; label: string; subLabel: string; onPress: () => void }[]
  >([]);

  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: { data: number[] }[];
  }>({
    labels: [],
    datasets: [{ data: [] }],
  });

  const [workoutStats, setWorkoutStats] = useState<{
    streak: number;
    totalThisWeek: number;
    totalThisMonth: number;
  }>({ streak: 0, totalThisWeek: 0, totalThisMonth: 0 });

  useEffect(() => {
    if (!data?.workoutSessionsByUser) return;

    const sessions: any[] = data.workoutSessionsByUser;
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const sorted = [...sessions].sort((a, b) => Number(b.startedAt) - Number(a.startedAt));

    const recent = sorted.slice(0, 5).map((session) => {
      const date = new Date(Number(session.startedAt));
      const durationMs = session.endedAt
        ? Number(session.endedAt) - Number(session.startedAt)
        : null;
      const duration =
        durationMs && durationMs > 0 && durationMs < 3 * 60 * 60 * 1000
          ? Math.round(durationMs / 60000)
          : null;
      return {
        id: String(session.id),
        label: session.notes || 'Workout',
        subLabel: `${date.toDateString()}${duration ? ` · ${duration} mins` : ''}`,
        onPress: () => {},
      };
    });
    setRecentWorkouts(recent);

    const dayCount = timeframe === 'Last 7 Days' ? 7 : 30;
    const counts: number[] = Array(dayCount).fill(0);
    const labels: string[] = [];

    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      if (timeframe === 'Last 7 Days') {
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      } else {
        labels.push(date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }));
      }
    }

    let streak = 0;
    let totalThisWeek = 0;
    let totalThisMonth = 0;

    sessions.forEach((session: any) => {
      const timestamp = Number(session.startedAt);
      if (isNaN(timestamp)) return;

      const date = new Date(timestamp);
      const dateStr = date.toISOString().split('T')[0];

      for (let i = 0; i < dayCount; i++) {
        const day = new Date();
        day.setDate(now.getDate() - (dayCount - 1 - i));
        const labelDate = day.toISOString().split('T')[0];
        if (labelDate === dateStr) {
          counts[i] += session.exerciseLogs?.length || 0;
          break;
        }
      }

      const daysAgo = Math.floor(
        (new Date(today).getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysAgo === streak) streak++;

      if (date.getMonth() === now.getMonth()) totalThisMonth++;
      if (now.getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000) totalThisWeek++;
    });

    setWorkoutStats({ streak, totalThisWeek, totalThisMonth });
    setChartData({
      labels,
      datasets: [
        {
          data: counts,
        },
      ],
    });
  }, [data, timeframe]);

  const renderChart = () => {
    const chart = (
      <BarChart
        data={chartData}
        width={timeframe === 'Last 7 Days' ? screenWidth - 114 : chartData.labels.length * 32}
        height={220}
        yAxisLabel=""
        yAxisSuffix=" sets"
        fromZero={true}
        showValuesOnTopOfBars={false}
        withInnerLines={false}
        chartConfig={{
          backgroundColor: theme.colors.background,
          backgroundGradientFrom: theme.colors.background,
          backgroundGradientTo: theme.colors.background,
          color: (_opacity = 1) => theme.colors.accentStart,
          labelColor: () => theme.colors.textPrimary,
          formatYLabel: (yValue) => parseInt(yValue).toString(),
          barPercentage: 0.5,
        }}
        style={{ marginTop: spacing.md, borderRadius: borderRadius.md }}
      />
    );

    return timeframe === 'Last 30 Days' ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={{ minWidth: chartData.labels.length * 32 }}
      >
        {chart}
      </ScrollView>
    ) : (
      chart
    );
  };

  return (
    <ScreenLayout scroll>
      <Title text="Your Progress" subtitle="Workout stats & trends" />

      <Card title="Workout Summary">
        <DetailField label="Current Streak" value={`${workoutStats.streak} days`} />
        <DetailField label="This Week" value={`${workoutStats.totalThisWeek} workouts`} />
        <DetailField label="This Month" value={`${workoutStats.totalThisMonth} workouts`} />
      </Card>

      <Card title="Total Sets Per Day">
        <SelectableField
          label="Timeframe"
          value={timeframe}
          onPress={() => setShowTimeframeModal(true)}
        />
        {renderChart()}
      </Card>

      <Card title="Recent Workouts">
        {recentWorkouts.length > 0 ? (
          <ClickableList items={recentWorkouts} />
        ) : (
          <NoResults message="No recent workouts found." icon="💪" />
        )}
      </Card>

      <OptionModal
        visible={showTimeframeModal}
        title="Select Timeframe"
        options={TIMEFRAME_OPTIONS}
        selected={timeframe}
        onSelect={(option: string) => {
          setTimeframe(option as 'Last 7 Days' | 'Last 30 Days');
          setShowTimeframeModal(false);
        }}
        onClose={() => setShowTimeframeModal(false)}
      />
    </ScreenLayout>
  );
};

export default ProgressOverviewScreen;
