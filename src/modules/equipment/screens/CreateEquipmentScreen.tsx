import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-native';

import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';

import { useEquipment } from '../hooks/useEquipment';
import { useAuth } from 'modules/auth/context/AuthContext';

import EquipmentForm from '../components/EquipmentForm';

export default function CreateEquipmentScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { getCategories, createEquipment } = useEquipment();
  const { data: categoryData, refetch: refetchCategories } = getCategories();
  const categories = categoryData?.equipmentCategories ?? [];

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
    { setSubmitting }: { setSubmitting: (val: boolean) => void }
  ) => {
    try {
      await createEquipment({
        variables: {
          input: {
            ...values,
            categoryId: Number(values.categoryId),
            subcategoryId: values.subcategoryId
              ? Number(values.subcategoryId)
              : undefined,
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
        refetchCategories={refetchCategories}
        submitLabel="Create"
        submitting={false}
        cancelLabel="Cancel"
        onCancel={() => navigate('/equipment')}
      />
    </ScreenLayout>
  );
}
