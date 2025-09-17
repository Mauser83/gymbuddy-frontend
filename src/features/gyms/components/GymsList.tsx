import React from 'react';
import { FlatList, TouchableOpacity } from 'react-native';

import { Gym } from 'features/gyms/types/gym.types';
import Card from 'shared/components/Card';
import DetailField from 'shared/components/DetailField';
import { spacing } from 'shared/theme/tokens';

interface GymsListProps {
  gyms: Gym[];
  onGymPress: (gym: Gym) => void;
}

const GymsList = React.memo(({ gyms, onGymPress }: GymsListProps) => (
  <FlatList
    data={gyms}
    keyExtractor={(item) => item.id.toString()}
    renderItem={({ item }) => (
      <TouchableOpacity onPress={() => onGymPress(item)}>
        <Card variant="glass" compact showChevron style={{ marginBottom: spacing.md }}>
          <DetailField label="📍 Name:" value={item.name} />
          <DetailField label="🌍 Country:" value={item.country || 'Unknown'} />
          <DetailField label="🏙️ City:" value={item.city || 'Unknown'} />
        </Card>
      </TouchableOpacity>
    )}
  />
));

export default GymsList;
