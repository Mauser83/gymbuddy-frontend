import React, {useEffect, useState} from 'react';
import {useQuery, useMutation} from '@apollo/client';
import {useNavigate} from 'react-router-native';
import {View} from 'react-native';

import {useAuth} from '../../auth/context/AuthContext';
import {
  GET_ALL_EQUIPMENTS,
  DELETE_EQUIPMENT,
} from '../graphql/equipment.graphql';
import {Equipment} from '../types/equipment.types';

import ScreenLayout from '../../../shared/components/ScreenLayout';
import SearchInput from 'shared/components/SearchInput';
import Button from 'shared/components/Button';
import ClickableList from 'shared/components/ClickableList';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';
import Card from 'shared/components/Card';
import {spacing} from 'shared/theme/tokens';

const GlobalEquipmentListScreen = () => {
  const {user} = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [equipments, setEquipments] = useState<Equipment[]>([]);

  const {data, loading, refetch} = useQuery(GET_ALL_EQUIPMENTS, {
    fetchPolicy: 'cache-and-network',
  });
  const [deleteEquipment] = useMutation(DELETE_EQUIPMENT);

  const handleDelete = async (id: number) => {
    console.log('Deleting equipment: ', id);
    // try {
    //   await deleteEquipment({variables: {id}});
    //   refetch();
    // } catch (err) {
    //   console.error('Failed to delete equipment', err);
    // }
  };

  const handleEdit = (id: number) => {
    console.log('Editing equipment: ', id);
    // navigation.navigate('EditEquipment', { id });
  };

  const handleAdd = () => {
    console.log('Creating equipment: ');
    // navigation.navigate('CreateEquipment');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      refetch({search: searchQuery || undefined});
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (data?.allEquipments) {
      setEquipments(data.allEquipments);
    }
  }, [data]);

  useEffect(() => {
    if (!user) navigate('/');
  }, [user]);

  const equipmentItems =
    equipments?.map((item: Equipment) => ({
      id: item.id,
      label: item.name,
      subLabel: `${item.brand} \u2022 ${item.category?.name}`,
      onPress: () => console.log('Equipment detail for ', item.id),
      rightElement: (
        <>
          <Button
            text="Edit"
            onPress={() => handleEdit(item.id)}
            variant="outline"
          />
          <Button
            text="Delete"
            onPress={() => handleDelete(item.id)}
            variant="solid"
          />
        </>
      ),
    })) ?? [];
  if (loading) {
    return (
      <ScreenLayout variant="centered">
        <Card variant="glass">
          <LoadingState text="Loading equipments..." />
        </Card>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <Card variant="glass" compact title="Global equipments" />
      <SearchInput
        placeholder="Search equipment..."
        onChange={setSearchQuery}
        value={searchQuery}
        onClear={() => setSearchQuery('')}
      />
      <View style={{position: 'relative', marginBottom: spacing.sm}}>
        <Button
          text="➕ Create New Equipment"
          onPress={() => navigate("/equipment/create")}
        />
      </View>
      <Card variant="glass" compact>
        {loading ? (
          <LoadingState text="Loading equipment..." />
        ) : equipments.length === 0 ? (
          <NoResults message="No equipment found." />
        ) : (
          <ClickableList items={equipmentItems} />
        )}
      </Card>
    </ScreenLayout>
  );
};

export default GlobalEquipmentListScreen;
