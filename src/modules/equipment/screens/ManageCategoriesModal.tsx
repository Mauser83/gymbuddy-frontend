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
import ButtonRow from 'shared/components/ButtonRow';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useTheme} from 'shared/theme/ThemeProvider';

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
  const {theme} = useTheme();

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
  const [expandedCatId, setExpandedCatId] = useState<number | null>(null);
  const [categoryEdits, setCategoryEdits] = useState<{
    [id: number]: {name: string; slug: string};
  }>({});
  const [subcategoryEdits, setSubcategoryEdits] = useState<{
    [id: number]: {name: string; slug: string};
  }>({});

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
            categoryId,
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
      await deleteSubcategory({variables: {id}});
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
      onPress: () => {
        setExpandedCatId(prev => (prev === cat.id ? null : cat.id));
        setCategoryEdits(prev => ({
          ...prev,
          [cat.id]: {
            name: cat.name,
            slug: cat.slug,
          },
        }));
      },
      content:
        expandedCatId === cat.id ? (
          <>
            <FormInput
              label="Name"
              value={categoryEdits[cat.id]?.name || ''}
              onChangeText={val => {
                setCategoryEdits(prev => {
                  const updated = {
                    ...prev[cat.id],
                    name: val,
                    ...(autoGenerateSlug && slugify
                      ? {slug: slugify(val)}
                      : {}),
                  };

                  return {
                    ...prev,
                    [cat.id]: updated,
                  };
                });
              }}
            />
            <FormInput
              label="Slug"
              editable={false}
              value={categoryEdits[cat.id]?.slug || ''}
            />
            <ButtonRow>
              <Button
                text="Update"
                disabled={
                  !(
                    categoryEdits[cat.id]?.name !== cat.name ||
                    categoryEdits[cat.id]?.slug !== cat.slug
                  )
                }
                onPress={() =>
                  handleUpdateCategory(
                    cat.id,
                    categoryEdits[cat.id]?.name ?? cat.name,
                    categoryEdits[cat.id]?.slug ?? cat.slug,
                  )
                }
              />
              <Button
                text="Delete"
                onPress={() => handleDeleteCategory(cat.id)}
              />
            </ButtonRow>
          </>
        ) : undefined,
    })) ?? [];

  const subCategoryItems =
    selectedCategory?.subcategories.map((sub: EquipmentSubcategory) => ({
      id: sub.id,
      label: sub.name,
      subLabel: `${sub.slug}`,
      rightElement:
        expandedSubId === sub.id ? (
          <FontAwesome
            name="chevron-down"
            size={16}
            color={theme.colors.accentStart}
          />
        ) : null,
      onPress: () => {
        setExpandedSubId(prev => (prev === sub.id ? null : sub.id));
        setSubcategoryEdits(prev => ({
          ...prev,
          [sub.id]: {
            name: sub.name,
            slug: sub.slug,
          },
        }));
      },
      content:
        expandedSubId === sub.id ? (
          <>
            <FormInput
              label="Name"
              value={subcategoryEdits[sub.id]?.name || ''}
              onChangeText={val => {
                setSubcategoryEdits(prev => {
                  const updated = {
                    ...prev[sub.id],
                    name: val,
                    ...(autoGenerateSlug && slugify
                      ? {slug: slugify(val)}
                      : {}),
                  };

                  return {
                    ...prev,
                    [sub.id]: updated,
                  };
                });
              }}
            />
            <FormInput
              label="Slug"
              editable={false}
              value={subcategoryEdits[sub.id]?.slug || ''}
            />
            <ButtonRow>
              <Button
                text="Update"
                disabled={
                  !(
                    subcategoryEdits[sub.id]?.name !== sub.name ||
                    subcategoryEdits[sub.id]?.slug !== sub.slug
                  )
                }
                onPress={() =>
                  handleUpdateSubcategory(
                    sub.id,
                    subcategoryEdits[sub.id]?.name ?? sub.name,
                    subcategoryEdits[sub.id]?.slug ?? sub.slug,
                  )
                }
              />
              <Button
                text="Delete"
                onPress={() => handleDeleteSubcategory(sub.id)}
              />
            </ButtonRow>
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
            <ScrollView style={{maxHeight: 300, marginTop: 16}}>
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
