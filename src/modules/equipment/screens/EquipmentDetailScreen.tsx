import React from 'react';
import { useRoute } from '@react-navigation/native';
import { useQuery } from '@apollo/client';
import { GET_EQUIPMENT_BY_ID } from '@/graphql/equipment';
import { ScreenLayout } from '@/components/layouts/ScreenLayout';
import { Title } from '@/components/ui/Title';
import { DetailField } from '@/components/ui/DetailField';
import { LoadingState } from '@/components/ui/LoadingState';
import { NoResults } from '@/components/ui/NoResults';

export default function EquipmentDetailScreen() {
  const route = useRoute();
  const { id } = route.params;

  const { data, loading } = useQuery(GET_EQUIPMENT_BY_ID, {
    variables: { id },
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
      <DetailField label="Created At" value={new Date(eq.createdAt).toLocaleString()} />
      <DetailField label="Updated At" value={new Date(eq.updatedAt).toLocaleString()} />
    </ScreenLayout>
  );
}
