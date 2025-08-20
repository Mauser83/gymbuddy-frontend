import React from 'react';
import {Text} from 'react-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import Title from 'shared/components/Title';

const WorkerTasksScreen = () => (
  <ScreenLayout scroll>
    <Card variant="glass">
      <Title text="Worker Tasks" subtitle="Background job controls" />
      <Text>Coming soon.</Text>
    </Card>
  </ScreenLayout>
);

export default WorkerTasksScreen;