import React, { useState, useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import { useQuery } from '@apollo/client';
import  ModalWrapper  from '../../../../shared/components/ModalWrapper';
import  SearchInput from '../../../../shared/components/SearchInput';
import  ClickableList  from '../../../../shared/components/ClickableList';
import  NoResults  from '../../../../shared/components/NoResults';
import { GET_GYMS } from '../graphql/userWorkouts.graphql';
import { spacing } from '../../../../shared/theme/tokens';

interface Gym {
  id: number;
  name: string;
  address?: string;
  city?: string;
  country?: string;
}

interface GymPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (gym: Gym) => void;
}

const modalHeight = Dimensions.get('window').height * 0.8;

export default function GymPickerModal({ visible, onClose, onSelect }: GymPickerModalProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data, loading } = useQuery(GET_GYMS, {
    variables: { search: debouncedSearch },
  });

  const gyms: Gym[] = data?.gyms ?? [];

  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <View style={{ padding: spacing.md, gap: spacing.md, height: modalHeight }}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search gyms by name or address"
          onClear={() => setSearch('')}
        />

        {!loading && gyms.length === 0 ? (
          <NoResults message="No gyms found." />
        ) : (
          <ClickableList
            items={gyms.map((gym) => ({
              id: String(gym.id),
              label: gym.name,
              subLabel: gym.address || gym.city || gym.country || '',
              onPress: () => {
                onSelect(gym);
                onClose();
              },
            }))}
          />
        )}
      </View>
    </ModalWrapper>
  );
}
