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
import {spacing} from 'shared/theme/tokens';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useTheme} from 'shared/theme/ThemeProvider';
import ButtonRow from 'shared/components/ButtonRow';

const GlobalEquipmentListScreen = () => {
  const {user} = useAuth();
  const navigate = useNavigate();
  const {theme} = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const {data, loading, refetch} = useQuery(GET_ALL_EQUIPMENTS, {
    fetchPolicy: 'cache-and-network',
  });
  const [deleteEquipment] = useMutation(DELETE_EQUIPMENT);

  const handleDelete = async (id: number) => {
    try {
      await deleteEquipment({variables: {id}});
      await refetch();
    } catch (err) {
      console.error('Failed to delete equipment', err);
    }
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

  console.log(data);

  const equipmentItems =
    equipments?.map((item: Equipment) => {
      const isExpanded = expandedId === item.id;

      return {
        id: item.id,
        label: item.name,
        subLabel: item.brand,
        selected: isExpanded,
        onPress: () => {
          setExpandedId(prev => (prev === item.id ? null : item.id));
        },
        rightElement: (
          <FontAwesome
            name={isExpanded ? 'chevron-down' : 'chevron-right'}
            size={16}
            color={theme.colors.accentStart}
          />
        ),
        content: isExpanded ? (
          <ButtonRow>
            <Button
              text="Edit"
              fullWidth
              onPress={() => navigate(`/equipment/edit/${item.id}`)}
            />
            <Button
              text="Delete"
              fullWidth
              onPress={() => handleDelete(item.id)}
            />
          </ButtonRow>
        ) : undefined,
      };
    }) ?? [];

  if (loading) {
    return (
      <ScreenLayout variant="centered">
        <LoadingState text="Loading equipments..." />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <SearchInput
        placeholder="Search equipment..."
        onChange={setSearchQuery}
        value={searchQuery}
        onClear={() => setSearchQuery('')}
      />
      <View style={{position: 'relative', marginBottom: spacing.sm}}>
        <Button
          text="➕ Create New Equipment"
          onPress={() => navigate('/equipment/create')}
        />
      </View>
      {equipments.length === 0 ? (
        <NoResults message="No equipment found." />
      ) : (
        <ClickableList items={equipmentItems} />
      )}
    </ScreenLayout>
  );
};

export default GlobalEquipmentListScreen;
