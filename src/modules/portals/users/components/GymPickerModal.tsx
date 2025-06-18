import React, {useState, useEffect} from 'react';
import {ScrollView, Dimensions} from 'react-native';
import {useQuery} from '@apollo/client';

import Title from 'shared/components/Title';
import SearchInput from 'shared/components/SearchInput';
import NoResults from 'shared/components/NoResults';

import {GET_GYMS} from '../graphql/userWorkouts.graphql';
import SelectableField from 'shared/components/SelectableField';
import ClickableListItem from 'shared/components/ClickableListItem';

interface Gym {
  id: number;
  name: string;
  address?: string;
  city?: string;
  country?: string;
}

interface GymPickerModalProps {
  onClose: () => void;
  onSelect: (gym: Gym) => void;
}

export default function GymPickerModal({
  onClose,
  onSelect,
}: GymPickerModalProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const {data, loading} = useQuery(GET_GYMS, {
    variables: {search: debouncedSearch},
  });

  const gyms: Gym[] = data?.gyms ?? [];

  const filteredGyms = gyms.filter(gym => {
    const term = debouncedSearch.toLowerCase().trim();
    return (
      gym.name.toLowerCase().includes(term) ||
      gym.address?.toLowerCase().includes(term) ||
      gym.city?.toLowerCase().includes(term) ||
      gym.country?.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <Title text="Select Gym" />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search gyms by name or location"
        onClear={() => setSearch('')}
      />

      <ScrollView style={{height: 500}}>
        {!loading && filteredGyms.length === 0 ? (
          <NoResults message="No gyms found." />
        ) : (
          filteredGyms.map(gym => (
            <ClickableListItem
              key={gym.id}
              label={gym.name}
              subLabel={gym.address || gym.city || gym.country || ''}
              onPress={() => {
                onSelect(gym);
                onClose();
              }}
            />
          ))
        )}
      </ScrollView>
    </>
  );
}
