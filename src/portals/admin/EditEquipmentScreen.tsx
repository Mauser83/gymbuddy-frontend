import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-native';

import EquipmentForm from 'src/features/equipment/components/EquipmentForm';
import {
  useEquipmentByIdQuery,
  useEquipmentCategoriesQuery,
  useEquipmentMutations,
} from 'src/features/equipment/hooks/useEquipment';
import { EquipmentCategory } from 'src/features/equipment/types/equipment.types';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import Title from 'src/shared/components/Title';

export default function EditEquipmentScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { updateEquipment } = useEquipmentMutations();
  const equipmentId = id ? Number(id) : null;
  const { data: equipmentData, loading: loadingEquipment } = useEquipmentByIdQuery(equipmentId);
  const { data: categoryData } = useEquipmentCategoriesQuery();
  const categories = useMemo(
    () =>
      (categoryData?.equipmentCategories ?? [])
        .map((cat: EquipmentCategory) => ({
          ...cat,
          subcategories: [...(cat.subcategories ?? [])].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        }))
        .sort((a: EquipmentCategory, b: EquipmentCategory) => a.name.localeCompare(b.name)),
    [categoryData],
  );

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
    { setSubmitting }: { setSubmitting: (val: boolean) => void },
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
        submitLabel="Update"
        submitting={false}
        cancelLabel="Cancel"
        onCancel={() => navigate('/equipment')}
      />
    </ScreenLayout>
  );
}
