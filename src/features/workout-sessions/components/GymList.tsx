import React from 'react';
import {ScrollView} from 'react-native';
import NoResults from 'shared/components/NoResults';
import ClickableListItem from 'shared/components/ClickableListItem';
import {Gym} from './GymPickerModal';

interface GymListProps {
  gyms: Gym[];
  loading: boolean;
  onSelect: (gym: Gym) => void;
}

const GymList = React.memo(({gyms, loading, onSelect}: GymListProps) => (
  <ScrollView style={{height: 500}}>
    {!loading && gyms.length === 0 ? (
      <NoResults message="No gyms found." />
    ) : (
      gyms.map(gym => (
        <ClickableListItem
          key={gym.id}
          label={gym.name}
          subLabel={gym.address || gym.city || gym.country || ''}
          onPress={() => onSelect(gym)}
        />
      ))
    )}
  </ScrollView>
));

export default GymList;