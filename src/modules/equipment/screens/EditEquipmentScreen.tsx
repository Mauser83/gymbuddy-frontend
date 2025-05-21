import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-native';

import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';

import { useEquipment } from '../hooks/useEquipment';
import EquipmentForm from '../components/EquipmentForm';

export default function EditEquipmentScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { getEquipmentById, getCategories, updateEquipment } = useEquipment();
  const { data: equipmentData, loading: loadingEquipment } = getEquipmentById(Number(id));
  const { data: categoryData, refetch: refetchCategories } = getCategories();
  const categories = categoryData?.equipmentCategories ?? [];

  if (loadingEquipment || !equipmentData?.equipment) {
    return (
      <ScreenLayout variant="centered">
        <Title text="Loading Equipment..." />
      </ScreenLayout>
    );
  }

  const equipment = equipmentData.equipment;

  const initialValues = {
    name: equipment.name || '',
    description: equipment.description || '',
    brand: equipment.brand || '',
    manualUrl: equipment.manualUrl || '',
    categoryId: equipment.categoryId || null,
    subcategoryId: equipment.subcategoryId || null,
  };

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (val: boolean) => void }
  ) => {
    try {
      await updateEquipment({
        variables: {
          id: Number(id),
          input: {
            ...values,
            categoryId: Number(values.categoryId),
            subcategoryId: values.subcategoryId ?? undefined,
          },
        },
      });
      navigate('/equipment');
    } catch (error) {
      console.error('Failed to update equipment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout scroll>
      <Title text="Edit Equipment" />
      <EquipmentForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        categories={categories}
        refetchCategories={refetchCategories}
        submitLabel="Update Equipment"
        submitting={false}
        cancelLabel="Cancel"
        onCancel={() => navigate('/equipment')}
      />
    </ScreenLayout>
  );
}
