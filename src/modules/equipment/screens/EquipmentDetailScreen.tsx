import React from 'react';
import {useParams} from 'react-router-native';
import {useQuery} from '@apollo/client';
import {GET_EQUIPMENT_BY_ID} from '../graphql/equipment.graphql';

import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import DetailField from 'shared/components/DetailField';
import LoadingState from 'shared/components/LoadingState';
import NoResults from 'shared/components/NoResults';
import CollapsibleList from 'shared/components/CollapsibleList';
import { ExerciseLite } from '../types/equipment.types';

export default function EquipmentDetailScreen() {
  const {id} = useParams<{id: string}>();

  const {data, loading} = useQuery(GET_EQUIPMENT_BY_ID, {
    variables: {id: Number(id)},
  });

  if (loading) return <LoadingState text="Loading equipment details..." />;
  if (!data?.equipment) return <NoResults message="Equipment not found." />;

  const eq = data.equipment;

  return (
    <ScreenLayout scroll>
      <Title text={eq.name} subtitle={eq.brand} />

      <DetailField label="Description" value={eq.description || '—'} />
      <DetailField label="Category" value={eq.category?.name || '—'} />
      <DetailField label="Subcategory" value={eq.subcategory?.name || '—'} />
      <DetailField label="Brand" value={eq.brand} />
      <DetailField label="Manual URL" value={eq.manualUrl || '—'} />
      <DetailField
        label="Created At"
        value={new Date(eq.createdAt).toLocaleString()}
      />
      <DetailField
        label="Updated At"
        value={new Date(eq.updatedAt).toLocaleString()}
      />
      {eq.compatibleExercises?.length > 0 ? (
        <CollapsibleList
          title={`Compatible Exercises (${eq.compatibleExercises.length})`}
          items={eq.compatibleExercises.map((ex: ExerciseLite) => ({
            id: ex.id.toString(),
            label: ex.name,
            onPress: () => {
              // You can link to the exercise detail if routing is set up
              console.log(`Open exercise ${ex.id}`);
            },
          }))}
          initiallyExpanded={false}
        />
      ) : (
        <DetailField
          label="Compatible Exercises"
          value="None found for this equipment."
        />
      )}
    </ScreenLayout>
  );
}
