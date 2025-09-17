import { useLazyQuery } from '@apollo/client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';

import SearchInput from 'src/shared/components/SearchInput';
import Title from 'src/shared/components/Title';
import { debounce } from 'src/shared/utils/helpers';

import GymList from './GymList';
import { GET_GYMS } from '../graphql/userWorkouts.graphql';

export interface Gym {
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

export default function GymPickerModal({ onClose, onSelect }: GymPickerModalProps) {
  const [search, setSearch] = useState('');

  const [fetchGyms, { data, loading }] = useLazyQuery(GET_GYMS);

  useEffect(() => {
    fetchGyms();
  }, [fetchGyms]);

  const debouncedFetch = useMemo(
    () =>
      debounce((q: string) => {
        fetchGyms({ variables: { search: q || undefined } });
      }, 500),
    [fetchGyms],
  );

  useEffect(() => {
    debouncedFetch(search);
  }, [search, debouncedFetch]);

  const gyms: Gym[] = data?.gyms ?? [];

  const handleSelect = useCallback(
    (gym: Gym) => {
      onSelect(gym);
      onClose();
    },
    [onSelect, onClose],
  );

  return (
    <>
      <Title text="Select Gym" />

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search gyms by name or location"
        onClear={() => setSearch('')}
      />

      <GymList gyms={gyms} loading={loading} onSelect={handleSelect} />
    </>
  );
}
