import React from 'react';
import { useNavigate } from 'react-router-native';

import Button from 'src/shared/components/Button';
import Card from 'src/shared/components/Card';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import Title from 'src/shared/components/Title';

const EquipmentRecognitionDashboardScreen = () => {
  const navigate = useNavigate();
  return (
    <ScreenLayout scroll>
      <Card variant="glass" title="📸 Equipment Recognition" compact />

      <Card variant="glass">
        <Title text="Batch Capture" subtitle="Upload images in batch" />
        <Button
          onPress={() => navigate('/admin/equipment-recognition/batch-capture')}
          text="Batch Capture"
        />
      </Card>

      <Card variant="glass">
        <Title text="Taxonomies" subtitle="Manage taxonomy values" />
        <Button
          onPress={() => navigate('/admin/equipment-recognition/taxonomies')}
          text="Manage Taxonomies"
        />
      </Card>

      <Card variant="glass">
        <Title text="KNN Playground" subtitle="Explore recognition model" />
        <Button
          onPress={() => navigate('/admin/equipment-recognition/knn')}
          text="KNN Playground"
        />
      </Card>

      <Card variant="glass">
        <Title text="Worker Tasks" subtitle="Background processing" />
        <Button
          onPress={() => navigate('/admin/equipment-recognition/worker-tasks')}
          text="Worker Tasks"
        />
      </Card>

      <Card variant="glass">
        <Title text="Image Management" subtitle="Browse uploaded images" />
        <Button
          onPress={() => navigate('/admin/equipment-recognition/images')}
          text="Image Management"
        />
      </Card>

      <Card variant="glass">
        <Title text="Signing Verifier" subtitle="Validate requests" />
        <Button
          onPress={() => navigate('/admin/equipment-recognition/signing')}
          text="Signing Verifier"
        />
      </Card>
    </ScreenLayout>
  );
};

export default EquipmentRecognitionDashboardScreen;
