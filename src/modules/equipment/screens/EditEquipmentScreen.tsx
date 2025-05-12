import React, { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_EQUIPMENT_BY_ID, UPDATE_EQUIPMENT } from '@/graphql/equipment';
import { ScreenLayout } from '@/components/layouts/ScreenLayout';
import { Title } from '@/components/ui/Title';
import { FormInput } from '@/components/ui/FormInput';
import { Button } from '@/components/ui/Button';
import { SelectableField } from '@/components/ui/SelectableField';
import { useCategories } from '@/hooks/useCategories';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function EditEquipmentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params;

  const [form, setForm] = useState({
    name: '',
    description: '',
    brand: '',
    manualUrl: '',
    categoryId: null,
    subcategoryId: null,
  });

  const { categories, subcategories, loadSubcategories } = useCategories();
  const { data } = useQuery(GET_EQUIPMENT_BY_ID, { variables: { id: Number(id) } });
  const [updateEquipment, { loading }] = useMutation(UPDATE_EQUIPMENT);

  useEffect(() => {
    if (data?.equipment) {
      const eq = data.equipment;
      setForm({
        name: eq.name || '',
        description: eq.description || '',
        brand: eq.brand || '',
        manualUrl: eq.manualUrl || '',
        categoryId: eq.categoryId || null,
        subcategoryId: eq.subcategoryId || null,
      });
      if (eq.categoryId) loadSubcategories(eq.categoryId);
    }
  }, [data]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'categoryId') {
      loadSubcategories(value);
      setForm((prev) => ({ ...prev, subcategoryId: null }));
    }
  };

  const handleSubmit = async () => {
    try {
      await updateEquipment({ variables: { id: Number(id), input: form } });
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update equipment:', error);
    }
  };

  return (
    <ScreenLayout scroll>
      <Title text="Edit Equipment" />

      <FormInput
        label="Name"
        value={form.name}
        onChangeText={(val) => handleChange('name', val)}
      />

      <FormInput
        label="Description"
        value={form.description}
        onChangeText={(val) => handleChange('description', val)}
      />

      <FormInput
        label="Brand"
        value={form.brand}
        onChangeText={(val) => handleChange('brand', val)}
      />

      <FormInput
        label="Manual URL"
        value={form.manualUrl}
        onChangeText={(val) => handleChange('manualUrl', val)}
      />

      <SelectableField
        label="Category"
        value={categories.find((c) => c.id === form.categoryId)?.name || 'Select Category'}
        onPress={() => {/* Open category selector */}}
      />

      <SelectableField
        label="Subcategory"
        value={subcategories.find((sc) => sc.id === form.subcategoryId)?.name || 'Select Subcategory'}
        onPress={() => {/* Open subcategory selector */}}
        disabled={!form.categoryId}
      />

      <Button text="Update Equipment" onPress={handleSubmit} loading={loading} />
    </ScreenLayout>
  );
}
