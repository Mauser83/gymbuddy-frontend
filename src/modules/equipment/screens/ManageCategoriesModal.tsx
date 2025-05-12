import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import {
  GET_EQUIPMENT_CATEGORIES,
  CREATE_CATEGORY,
  CREATE_SUBCATEGORY,
  UPDATE_CATEGORY,
  DELETE_CATEGORY,
  UPDATE_SUBCATEGORY,
  DELETE_SUBCATEGORY,
} from '../graphql/equipment.graphql';
import ModalWrapper from 'shared/components/ModalWrapper';
import Title from 'shared/components/Title';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import ClickableList from 'shared/components/ClickableList';
import OptionItem from 'shared/components/OptionItem';
import ContentContainer from 'shared/components/ContentContainer';
import { EquipmentCategory, EquipmentSubcategory } from '../types/equipment.types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ManageCategoriesModal({ visible, onClose }: Props) {
  const { data, refetch } = useQuery<{ equipmentCategories: EquipmentCategory[] }>(GET_EQUIPMENT_CATEGORIES);
  const [createCategory] = useMutation(CREATE_CATEGORY);
  const [createSubcategory] = useMutation(CREATE_SUBCATEGORY);
  const [updateCategory] = useMutation(UPDATE_CATEGORY);
  const [deleteCategory] = useMutation(DELETE_CATEGORY);
  const [updateSubcategory] = useMutation(UPDATE_SUBCATEGORY);
  const [deleteSubcategory] = useMutation(DELETE_SUBCATEGORY);

  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [newSubSlug, setNewSubSlug] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [selectingCategory, setSelectingCategory] = useState(false);

  const handleCreateCategory = async () => {
    try {
      await createCategory({ variables: { input: { name: newCatName, slug: newCatSlug } } });
      setNewCatName('');
      setNewCatSlug('');
      refetch();
    } catch (err) {
      console.error('Error creating category', err);
    }
  };

  const handleCreateSubcategory = async () => {
    try {
      await createSubcategory({
        variables: {
          input: {
            name: newSubName,
            slug: newSubSlug,
            categoryId: selectedCatId as number,
          },
        },
      });
      setNewSubName('');
      setNewSubSlug('');
      refetch();
    } catch (err) {
      console.error('Error creating subcategory', err);
    }
  };

  const handleUpdateCategory = async (id: number, name: string, slug: string) => {
    try {
      await updateCategory({ variables: { id, input: { name, slug } } });
      refetch();
    } catch (err) {
      console.error('Error updating category', err);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await deleteCategory({ variables: { id } });
      if (selectedCatId === id) setSelectedCatId(null);
      refetch();
    } catch (err) {
      console.error('Error deleting category', err);
    }
  };

  const handleUpdateSubcategory = async (id: number, name: string, slug: string) => {
    try {
      await updateSubcategory({ variables: { id, input: { name, slug } } });
      refetch();
    } catch (err) {
      console.error('Error updating subcategory', err);
    }
  };

  const handleDeleteSubcategory = async (id: number) => {
    try {
      await deleteSubcategory({ variables: { id } });
      refetch();
    } catch (err) {
      console.error('Error deleting subcategory', err);
    }
  };

  const categoryItems = data?.equipmentCategories?.map((cat: EquipmentCategory) => ({
    id: cat.id,
    label: cat.name,
    subLabel: `${cat.slug} (${cat.subcategories.length} subcategories)`,
    onPress: () => setSelectedCatId(cat.id),
    rightElement: (
      <Button text="Delete" variant="outline" onPress={() => handleDeleteCategory(cat.id)} />
    ),
  })) ?? [];

  const selectedCategory = data?.equipmentCategories?.find((cat: EquipmentCategory) => cat.id === selectedCatId);

  return (
    <>
      <ModalWrapper visible={visible} onClose={onClose}>
        <Title text="Manage Categories & Subcategories" />

        <FormInput
          label="New Category Name"
          value={newCatName}
          onChangeText={setNewCatName}
        />
        <FormInput label="Slug" value={newCatSlug} onChangeText={setNewCatSlug} />
        <Button text="Create Category" onPress={handleCreateCategory} />

        <ClickableList items={categoryItems} />

        {selectedCategory && (
          <ContentContainer>
            <Title text={`Subcategories for ${selectedCategory.name}`} />

            {selectedCategory.subcategories.map((sub: EquipmentSubcategory) => (
              <ContentContainer key={sub.id}>
                <FormInput
                  label="Name"
                  value={sub.name}
                  onChangeText={(val) => handleUpdateSubcategory(sub.id, val, sub.slug)}
                />
                <FormInput
                  label="Slug"
                  value={sub.slug}
                  onChangeText={(val) => handleUpdateSubcategory(sub.id, sub.name, val)}
                />
                <Button
                  text="Delete Subcategory"
                  variant="outline"
                  onPress={() => handleDeleteSubcategory(sub.id)}
                />
              </ContentContainer>
            ))}

            <FormInput
              label="New Subcategory Name"
              value={newSubName}
              onChangeText={setNewSubName}
            />
            <FormInput label="Slug" value={newSubSlug} onChangeText={setNewSubSlug} />
            <Button text="Add Subcategory" onPress={handleCreateSubcategory} />
          </ContentContainer>
        )}
      </ModalWrapper>

      {/* Category Selector Modal */}
      {selectingCategory && (
        <ModalWrapper visible onClose={() => setSelectingCategory(false)}>
          <ScrollView>
            {data?.equipmentCategories?.map((cat: EquipmentCategory) => (
              <OptionItem
                key={cat.id}
                text={cat.name}
                onPress={() => {
                  setSelectedCatId(cat.id);
                  setSelectingCategory(false);
                }}
              />
            ))}
          </ScrollView>
        </ModalWrapper>
      )}
    </>
  );
}
