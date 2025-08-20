import React from 'react';
import {Text} from 'react-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import Title from 'shared/components/Title';

const KnnPlaygroundScreen = () => (
  <ScreenLayout scroll>
    <Card variant="glass">
      <Title text="KNN Playground" subtitle="Read-only demo" />
      <Text>Coming soon.</Text>
    </Card>
  </ScreenLayout>
);

export default KnnPlaygroundScreen;