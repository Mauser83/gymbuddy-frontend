import React from 'react';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Card from 'shared/components/Card';
import {ScrollView, TouchableOpacity} from 'react-native';
import {useNavigate} from 'react-router-native';

const AdminSystemCatalogScreen = () => {
  const navigate = useNavigate();

  return (
    <ScreenLayout scroll>
      <Title
        text="System Catalog Management"
        subtitle="Admin-only controls for static entities"
      />

      <ScrollView>
        {/* Equipment Category Management */}
        <TouchableOpacity onPress={() => navigate('/admin/catalog/equipment')}>
          <Card title="Equipment Catalog" showChevron />
        </TouchableOpacity>

        {/* Exercise Metadata Management */}
        <TouchableOpacity onPress={() => navigate('/admin/catalog/exercise')}>
          <Card title="Exercise Metadata" showChevron />
        </TouchableOpacity>

        {/* Workout Plan Settings */}
        <TouchableOpacity
          onPress={() => navigate('/admin/catalog/workoutplan')}>
          <Card title="Workout Plan Settings" showChevron />
        </TouchableOpacity>
      </ScrollView>
    </ScreenLayout>
  );
};

export default AdminSystemCatalogScreen;
