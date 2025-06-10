import React from 'react';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Card from 'shared/components/Card';
import {TouchableOpacity, View} from 'react-native';
import {useNavigate} from 'react-router-native';

const AdminSystemCatalogScreen = () => {
  const navigate = useNavigate();

  return (
    // The parent ScreenLayout handles all scrolling
    <ScreenLayout scroll>
      <Title
        text="System Catalog Management"
        subtitle="Admin-only controls for static entities"
      />

      {/* No inner ScrollView is needed */}
      <View>
        <TouchableOpacity onPress={() => navigate('/admin/catalog/equipment')}>
          <Card title="Equipment Catalog" showChevron />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigate('/admin/catalog/exercise')}>
          <Card title="Exercise Metadata" showChevron />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigate('/admin/catalog/workoutplan')}>
          <Card title="Workout Plan Settings" showChevron />
        </TouchableOpacity>
      </View>
    </ScreenLayout>
  );
};

export default AdminSystemCatalogScreen;
