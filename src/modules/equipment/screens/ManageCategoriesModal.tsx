import React, {useState} from 'react';
import {ScrollView} from 'react-native';
import {useMutation, useQuery} from '@apollo/client';
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
import {
  EquipmentCategory,
  EquipmentSubcategory,
} from '../types/equipment.types';

type Mode = 'category' | 'subcategory';

interface ManageCategoriesModalProps {
  visible: boolean;
  onClose: () => void;
  slugify: (text: string) => string;
  autoGenerateSlug?: boolean;
  mode: Mode;
  categoryId?: number; // required for subcategory mode
}

export default function ManageCategoriesModal({
  visible,
  onClose,
  slugify,
  autoGenerateSlug = false,
  mode,
  categoryId,
}: ManageCategoriesModalProps) {
  const {data, refetch} = useQuery<{equipmentCategories: EquipmentCategory[]}>(
    GET_EQUIPMENT_CATEGORIES,
  );
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
  const [expandedSubId, setExpandedSubId] = useState<number | null>(null);


  const handleCreateCategory = async () => {
    try {
      await createCategory({
        variables: {input: {name: newCatName, slug: newCatSlug}},
      });
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
            categoryId: Number(categoryId),
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

  const handleUpdateCategory = async (
    id: number,
    name: string,
    slug: string,
  ) => {
    try {
      await updateCategory({variables: {id, input: {name, slug}}});
      refetch();
    } catch (err) {
      console.error('Error updating category', err);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await deleteCategory({variables: {id}});
      if (selectedCatId === id) setSelectedCatId(null);
      refetch();
    } catch (err) {
      console.error('Error deleting category', err);
    }
  };

  const handleUpdateSubcategory = async (
    id: number,
    name: string,
    slug: string,
  ) => {
    try {
      await updateSubcategory({variables: {id, input: {name, slug}}});
      refetch();
    } catch (err) {
      console.error('Error updating subcategory', err);
    }
  };

  const handleDeleteSubcategory = async (id: number) => {
    try {
      await deleteSubcategory({variables: { id: Number(id) } });
      refetch();
    } catch (err) {
      console.error('Error deleting subcategory', err);
    }
  };

  const selectedCategory = data?.equipmentCategories?.find(
    (cat: EquipmentCategory) => cat.id === categoryId,
  );

  const categoryItems =
    data?.equipmentCategories?.map((cat: EquipmentCategory) => ({
      id: cat.id,
      label: cat.name,
      subLabel: `${cat.slug}`,
      onPress: () => setSelectedCatId(cat.id),
      rightElement: (
        <Button
          text="Delete"
          variant="outline"
          onPress={() => handleDeleteCategory(cat.id)}
        />
      ),
    })) ?? [];

  const subCategoryItems =
    selectedCategory?.subcategories.map((sub: EquipmentSubcategory) => ({
      id: sub.id,
      label: sub.name,
      subLabel: `${sub.slug}`,
      onPress: () => setExpandedSubId(prev => (prev === sub.id ? null : sub.id)),
      content: expandedSubId === sub.id ? (
      <>
        <FormInput
          label="Name"
          value={sub.name}
          onChangeText={val => handleUpdateSubcategory(sub.id, val, sub.slug)}
        />
        <FormInput
          label="Slug"
          value={sub.slug}
          onChangeText={val => handleUpdateSubcategory(sub.id, sub.name, val)}
        />
        <Button
          text="Delete Subcategory"
          variant="outline"
          onPress={() => handleDeleteSubcategory(sub.id)}
        />
      </>
      ) : undefined,
    })) ?? [];

  return (
    <>
      <ModalWrapper visible={visible} onClose={onClose}>
        <Title
          text={
            mode === 'category'
              ? 'Manage Categories'
              : selectedCategory
                ? `Manage Subcategories for ${selectedCategory.name}`
                : 'Manage Subcategories'
          }
        />

        {mode === 'category' && (
          <>
            <FormInput
              label="New Category Name"
              value={newCatName}
              onChangeText={val => {
                setNewCatName(val);
                if (autoGenerateSlug && slugify) {
                  setNewCatSlug(slugify(val));
                }
              }}
            />
            <FormInput
              label="Slug"
              value={newCatSlug}
              onChangeText={setNewCatSlug}
            />
            <Button text="Create Category" onPress={handleCreateCategory} />
            <ClickableList items={categoryItems} />
          </>
        )}

        {mode === 'subcategory' && selectedCategory && (
          <>
            <FormInput
              label="New Subcategory Name"
              value={newSubName}
              onChangeText={val => {
                setNewSubName(val);
                if (autoGenerateSlug && slugify) {
                  setNewSubSlug(slugify(val));
                }
              }}
            />
            <FormInput
              label="Slug"
              value={newSubSlug}
              onChangeText={setNewSubSlug}
            />
            <Button text="Add Subcategory" onPress={handleCreateSubcategory} />
              <ScrollView style={{ maxHeight: 300, marginTop: 16 }}>

            <ClickableList items={subCategoryItems} />
            </ScrollView>
          </>
        )}
      </ModalWrapper>

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
