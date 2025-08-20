import React from 'react';
import {Text} from 'react-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import Title from 'shared/components/Title';

const BatchCaptureScreen = () => {
  return (
    <ScreenLayout scroll>
      <Card variant="glass">
        <Title text="Batch Capture" subtitle="Capture equipment images in bulk" />
        <Text>Batch capture feature coming soon.</Text>
      </Card>
    </ScreenLayout>
  );
};

export default BatchCaptureScreen;