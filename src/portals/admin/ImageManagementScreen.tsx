import React from 'react';
import {Text} from 'react-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import Title from 'shared/components/Title';

const ImageManagementScreen = () => (
  <ScreenLayout scroll>
    <Card variant="glass">
      <Title text="Image Management" subtitle="Browse uploaded images" />
      <Text>Coming soon.</Text>
    </Card>
  </ScreenLayout>
);

export default ImageManagementScreen;