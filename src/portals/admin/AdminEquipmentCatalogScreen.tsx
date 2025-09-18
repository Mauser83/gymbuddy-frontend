import { useQuery, useMutation } from '@apollo/client';
import React, { useState, useMemo } from 'react';
import { View } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import {
  GET_EQUIPMENT_CATEGORIES,
  CREATE_CATEGORY,
  CREATE_SUBCATEGORY,
  UPDATE_CATEGORY,
  DELETE_CATEGORY,
  UPDATE_SUBCATEGORY,
  DELETE_SUBCATEGORY,
} from 'src/features/equipment/graphql/equipment.graphql';
import {
  EquipmentCategory,
  EquipmentSubcategory,
} from 'src/features/equipment/types/equipment.types';
import Button from 'src/shared/components/Button';
import ButtonRow from 'src/shared/components/ButtonRow';
import Card from 'src/shared/components/Card';
import ClickableList from 'src/shared/components/ClickableList';
import FormInput from 'src/shared/components/FormInput';
import LoadingState from 'src/shared/components/LoadingState';
import NoResults from 'src/shared/components/NoResults';
import ScreenLayout from 'src/shared/components/ScreenLayout';
import Title from 'src/shared/components/Title';
import { useTheme } from 'src/shared/theme/ThemeProvider';

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AdminEquipmentCatalogScreen() {
  const { theme } = useTheme();
  const { data, refetch, loading, error } = useQuery(GET_EQUIPMENT_CATEGORIES);
  const categories = useMemo(
    () => [...(data?.equipmentCategories ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [data],
  );

  const [newCatName, setNewCatName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [expandedCatId, setExpandedCatId] = useState<number | null>(null);
  const [expandedSubId, setExpandedSubId] = useState<number | null>(null);
  const [categoryEdits, setCategoryEdits] = useState<
    Record<number, { name: string; slug: string }>
  >({});
  const [subcategoryEdits, setSubcategoryEdits] = useState<
    Record<number, { name: string; slug: string }>
  >({});

  const [createCategory] = useMutation(CREATE_CATEGORY);
  const [createSubcategory] = useMutation(CREATE_SUBCATEGORY);
  const [updateCategory] = useMutation(UPDATE_CATEGORY);
  const [deleteCategory] = useMutation(DELETE_CATEGORY);
  const [updateSubcategory] = useMutation(UPDATE_SUBCATEGORY);
  const [deleteSubcategory] = useMutation(DELETE_SUBCATEGORY);

  const selectedCategory = categories.find((cat: EquipmentCategory) => cat.id === selectedCatId);

  const handleCreateCategory = async () => {
    await createCategory({
      variables: { input: { name: newCatName, slug: slugify(newCatName) } },
    });
    setNewCatName('');
    refetch();
  };

  const handleCreateSubcategory = async () => {
    if (!selectedCatId) return;
    await createSubcategory({
      variables: {
        input: {
          name: newSubName,
          slug: slugify(newSubName),
          categoryId: selectedCatId,
        },
      },
    });
    setNewSubName('');
    refetch();
  };

  const categoryItems = categories.map((cat: EquipmentCategory) => ({
    id: cat.id,
    label: cat.name,
    subLabel: cat.slug,
    selected: expandedCatId === cat.id,
    rightElement:
      expandedCatId === cat.id ? (
        <FontAwesome name="chevron-down" size={16} color={theme.colors.accentStart} />
      ) : null,
    onPress: () => {
      setExpandedCatId((prev) => (prev === cat.id ? null : cat.id));
      setCategoryEdits((prev) => ({
        ...prev,
        [cat.id]: { name: cat.name, slug: cat.slug },
      }));
      setSelectedCatId(cat.id);
    },
    content: expandedCatId === cat.id && (
      <>
        <FormInput
          label="Name"
          value={categoryEdits[cat.id]?.name || ''}
          onChangeText={(val) =>
            setCategoryEdits((prev) => ({
              ...prev,
              [cat.id]: { name: val, slug: slugify(val) },
            }))
          }
        />
        <ButtonRow>
          <Button
            text="Update"
            fullWidth
            onPress={() =>
              updateCategory({
                variables: { id: cat.id, input: categoryEdits[cat.id] },
              }).then(refetch)
            }
          />
          <Button
            text="Delete"
            fullWidth
            onPress={() => deleteCategory({ variables: { id: cat.id } }).then(refetch)}
          />
        </ButtonRow>
      </>
    ),
  }));

  const subcategoryItems =
    selectedCategory?.subcategories
      .slice()
      .sort((a: EquipmentSubcategory, b: EquipmentSubcategory) => a.name.localeCompare(b.name))
      .map((sub: EquipmentSubcategory) => ({
        id: sub.id,
        label: sub.name,
        subLabel: sub.slug,
        selected: expandedSubId === sub.id,
        rightElement:
          expandedSubId === sub.id ? (
            <FontAwesome name="chevron-down" size={16} color={theme.colors.accentStart} />
          ) : null,
        onPress: () => {
          setExpandedSubId((prev) => (prev === sub.id ? null : sub.id));
          setSubcategoryEdits((prev) => ({
            ...prev,
            [sub.id]: { name: sub.name, slug: sub.slug },
          }));
        },
        content: expandedSubId === sub.id && (
          <>
            <FormInput
              label="Name"
              value={subcategoryEdits[sub.id]?.name || ''}
              onChangeText={(val) =>
                setSubcategoryEdits((prev) => ({
                  ...prev,
                  [sub.id]: { name: val, slug: slugify(val) },
                }))
              }
            />
            <ButtonRow>
              <Button
                text="Update"
                fullWidth
                onPress={() =>
                  updateSubcategory({
                    variables: { id: sub.id, input: subcategoryEdits[sub.id] },
                  }).then(refetch)
                }
              />
              <Button
                text="Delete"
                fullWidth
                onPress={() => deleteSubcategory({ variables: { id: sub.id } }).then(refetch)}
              />
            </ButtonRow>
          </>
        ),
      })) || [];

  if (loading)
    return (
      <ScreenLayout>
        <LoadingState text="Loading categories..." />
      </ScreenLayout>
    );
  if (error)
    return (
      <ScreenLayout>
        <NoResults message="Error finding category data." />
      </ScreenLayout>
    );

  return (
    <ScreenLayout scroll>
      <Title
        text="Manage Equipment Categories & Subcategories"
        subtitle="Admin-only management interface"
      />

      <Card>
        <Title text="Categories" />
        <FormInput label="Category Name" value={newCatName} onChangeText={setNewCatName} />
        <Button text="Create Category" onPress={handleCreateCategory} fullWidth />
        <View style={{ paddingTop: 8 }}>
          <ClickableList items={categoryItems} />
        </View>
      </Card>

      {selectedCatId ? (
        <>
          <Card>
            <Title text={`Subcategories for ${selectedCategory?.name}`} />
            <FormInput label="Subcategory Name" value={newSubName} onChangeText={setNewSubName} />
            <Button text="Create Subcategory" onPress={handleCreateSubcategory} fullWidth />
            <View style={{ paddingTop: 8 }}>
              <ClickableList items={subcategoryItems} />
            </View>
          </Card>
        </>
      ) : (
        <Card>
          <Title text="Subcategories" subtitle="Select a category to manage subcategories" />
          <FormInput
            label="Subcategory Name"
            editable={false}
            value={newSubName}
            onChangeText={setNewSubName}
          />
          <Button text="Create Subcategory" disabled onPress={handleCreateSubcategory} fullWidth />
        </Card>
      )}
    </ScreenLayout>
  );
}
