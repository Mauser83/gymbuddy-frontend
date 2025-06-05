import React from 'react';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import Card from 'shared/components/Card';
import ClickableList from 'shared/components/ClickableList';
import {ScrollView} from 'react-native';
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
        <Card>
          <Title text="Equipment Catalog" />
          <ClickableList
            items={[
              {
                id: 'equipment-admin',
                label: 'Manage Equipment Categories & Subcategories',
                onPress: () => navigate('/admin/catalog/equipment'),
              },
            ]}
          />
        </Card>

        {/* Exercise Metadata Management */}
        <Card>
          <Title text="Exercise Metadata" />
          <ClickableList
            items={[
              {
                id: 'exercise-admin',
                label: 'Manage Exercise Metadata',
                onPress: () => navigate('/admin/catalog/exercise'),
              },
            ]}
          />
        </Card>

        {/* Workout Plan Settings */}
        <Card>
          <Title text="Workout Plan Settings" />
          <ClickableList
            items={[
              {
                id: 'workoutplan-admin',
                label: 'Manage Workout Plan Settings',
                onPress: () => navigate('/admin/catalog/workoutplan'),
              },
            ]}
          />
        </Card>

        {/* Metric Management */}
        <Card>
          <Title text="Metrics" />
          <ClickableList
            items={[{id: 'metric', label: 'Manage Metrics', onPress: () => {}}]}
          />
        </Card>
      </ScrollView>
    </ScreenLayout>
  );
};

export default AdminSystemCatalogScreen;
