import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-native';

import { useAuth } from 'features/auth/context/AuthContext';
import { useEquipment } from 'features/equipment/hooks/useEquipment';
import { EquipmentCategory } from 'features/equipment/types/equipment.types';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';

import EquipmentForm from '../../features/equipment/components/EquipmentForm';

export default function CreateEquipmentScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { getCategories, createEquipment } = useEquipment();
  const { data: categoryData } = getCategories();
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

  useEffect(() => {
    if (!user) navigate('/');
  }, [user]);

  const initialValues = {
    name: '',
    description: '',
    brand: '',
    manualUrl: '',
    categoryId: null,
    subcategoryId: null,
  };

  const handleSubmit = async (
    values: typeof initialValues,
    { setSubmitting }: { setSubmitting: (val: boolean) => void },
  ) => {
    try {
      await createEquipment({
        variables: {
          input: {
            ...values,
            categoryId: Number(values.categoryId),
            subcategoryId: values.subcategoryId ? Number(values.subcategoryId) : undefined,
          },
        },
      });
      navigate('/equipment');
    } catch (error) {
      console.error('Failed to create equipment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout scroll>
      <Title text="Add New Equipment" />
      <EquipmentForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        categories={categories}
        submitLabel="Create"
        submitting={false}
        cancelLabel="Cancel"
        onCancel={() => navigate('/equipment')}
      />
    </ScreenLayout>
  );
}
