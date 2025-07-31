import React, {useEffect, useState} from 'react';
import {useQuery, useMutation} from '@apollo/client';
import {useNavigate} from 'react-router-native';
import {View, FlatList} from 'react-native'; // Import FlatList

import {useAuth} from '../../features/auth/context/AuthContext';
import {
  GET_ALL_EQUIPMENTS,
  DELETE_EQUIPMENT,
} from '../../features/equipment/graphql/equipment.graphql';
import {Equipment} from '../../features/equipment/types/equipment.types';

import ScreenLayout from '../../shared/components/ScreenLayout';
import SearchInput from 'shared/components/SearchInput';
import Button from 'shared/components/Button';
import ClickableList from 'shared/components/ClickableList';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';
import {spacing} from 'shared/theme/tokens';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useTheme} from 'shared/theme/ThemeProvider';
import ButtonRow from 'shared/components/ButtonRow';
import DividerWithLabel from 'shared/components/DividerWithLabel';
import Card from 'shared/components/Card';

const GlobalEquipmentListScreen = () => {
  const {user} = useAuth();
  const navigate = useNavigate();
  const {theme} = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');

  const {data, loading, refetch} = useQuery(GET_ALL_EQUIPMENTS, {
    fetchPolicy: 'cache-and-network',
    variables: { search: searchQuery || undefined }
  });
  const [deleteEquipment] = useMutation(DELETE_EQUIPMENT);

  useEffect(() => {
    const timer = setTimeout(() => {
      refetch({search: searchQuery || undefined});
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, refetch]);

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  const handleDelete = async (id: number) => {
    try {
      await deleteEquipment({variables: {id}});
      refetch();
    } catch (err) {
      console.error('Failed to delete equipment', err);
    }
  };

  const equipments = data?.allEquipments ?? [];

  const renderEquipmentItem = ({ item }: { item: Equipment }) => {
    const isExpanded = expandedId === item.id;
    const filteredExercises = isExpanded
      ? (item.compatibleExercises?.filter(ex =>
          ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()),
        ) ?? [])
      : [];

    return (
      <Card variant="glass" style={{ marginBottom: spacing.md }}>
        <ClickableList
            items={[{
                id: item.id,
                label: item.name,
                subLabel: `${item.brand} • ${item.compatibleExercises?.length ?? 0} exercises`,
                selected: isExpanded,
                onPress: () => {
                    setExpandedId(prev => (prev === item.id ? null : item.id));
                    setExerciseSearch(''); // Reset exercise search on toggle
                },
                rightElement: (
                    <FontAwesome
                        name={isExpanded ? 'chevron-down' : 'chevron-right'}
                        size={16}
                        color={theme.colors.accentStart}
                    />
                ),
                content: isExpanded ? (
                    <>
                        <ButtonRow>
                            <Button text="Edit" fullWidth onPress={() => navigate(`/equipment/edit/${item.id}`)} />
                            <Button text="Delete" fullWidth onPress={() => handleDelete(item.id)} />
                        </ButtonRow>
                        <DividerWithLabel label="Compatible Exercises" />
                        <SearchInput
                            placeholder="Search exercises..."
                            value={exerciseSearch}
                            onChange={setExerciseSearch}
                            onClear={() => setExerciseSearch('')}
                        />
                        {filteredExercises.length > 0 ? (
                            <ClickableList
                                items={filteredExercises.map(ex => ({
                                    id: ex.id,
                                    label: ex.name,
                                    onPress: () => navigate(`/exercise/${ex.id}`),
                                }))}
                            />
                        ) : (
                            <NoResults message="No matching exercises." />
                        )}
                    </>
                ) : undefined
            }]}
        />
      </Card>
    );
  };

  const ListHeader = (
      <>
        <SearchInput
            placeholder="Search equipment..."
            onChange={setSearchQuery}
            value={searchQuery}
            onClear={() => setSearchQuery('')}
        />
        <View style={{ marginVertical: spacing.md }}>
            <Button
                text="➕ Create New Equipment"
                onPress={() => navigate('/equipment/create')}
            />
        </View>
      </>
  );

  return (
    <ScreenLayout>
        {loading && equipments.length === 0 ? (
            <LoadingState text="Loading equipment..." />
        ) : (
            <FlatList
                data={equipments}
                renderItem={renderEquipmentItem}
                keyExtractor={item => item.id.toString()}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={<NoResults message="No equipment found." />}
            />
        )}
    </ScreenLayout>
  );
};

export default GlobalEquipmentListScreen;
