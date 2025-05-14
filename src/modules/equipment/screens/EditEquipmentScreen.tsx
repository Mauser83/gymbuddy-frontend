import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-native';
import {Formik} from 'formik';
import * as Yup from 'yup';

import {useEquipment} from '../hooks/useEquipment';
import {
  EquipmentCategory,
  EquipmentSubcategory,
} from '../types/equipment.types';

import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import SelectableField from 'shared/components/SelectableField';
import ModalWrapper from 'shared/components/ModalWrapper';
import ManageCategoriesModal from './ManageCategoriesModal';
import ClickableList from 'shared/components/ClickableList';
import DividerWithLabel from 'shared/components/DividerWithLabel';
import ButtonRow from 'shared/components/ButtonRow';

const EquipmentSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  brand: Yup.string().required('Brand is required'),
  description: Yup.string(),
  manualUrl: Yup.string().url('Must be a valid URL'),
  categoryId: Yup.number().required('Category is required'),
  subcategoryId: Yup.number().nullable(),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function EditEquipmentScreen() {
  const {id} = useParams();
  const navigate = useNavigate();

  const {getEquipmentById, getCategories, updateEquipment} = useEquipment();
  const {data: equipmentData, loading: loadingEquipment} = getEquipmentById(
    Number(id),
  );
  const {data: categoryData, refetch: refetchCategories} = getCategories();
  const categories = categoryData?.equipmentCategories ?? [];

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showManageCategoryModal, setShowManageCategoryModal] = useState(false);
  const [showManageSubcategoryModal, setShowManageSubcategoryModal] =
    useState(false);

  const subcategories: EquipmentSubcategory[] =
    categories.find((cat: EquipmentCategory) => cat.id === selectedCategoryId)
      ?.subcategories ?? [];

  useEffect(() => {
    const catId = equipmentData?.equipment?.categoryId;
    if (catId) setSelectedCategoryId(catId);
  }, [equipmentData]);

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
    {setSubmitting}: {setSubmitting: (val: boolean) => void},
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

      <Formik
        initialValues={initialValues}
        validationSchema={EquipmentSchema}
        onSubmit={handleSubmit}
        enableReinitialize>
        {({
          values,
          errors,
          touched,
          handleChange,
          handleSubmit,
          isSubmitting,
          setFieldValue,
          setFieldTouched,
          dirty,
        }) => (
          <>
            <FormInput
              label="Name"
              value={values.name}
              onChangeText={handleChange('name')}
              onBlur={() => setFieldTouched('name', true)}
              error={
                touched.name && typeof errors.name === 'string'
                  ? errors.name
                  : undefined
              }
            />

            <FormInput
              label="Description"
              value={values.description}
              onChangeText={handleChange('description')}
              onBlur={() => setFieldTouched('description', true)}
              error={
                touched.description && typeof errors.description === 'string'
                  ? errors.description
                  : undefined
              }
            />

            <FormInput
              label="Brand"
              value={values.brand}
              onChangeText={handleChange('brand')}
              onBlur={() => setFieldTouched('brand', true)}
              error={
                touched.brand && typeof errors.brand === 'string'
                  ? errors.brand
                  : undefined
              }
            />

            <FormInput
              label="Manual URL"
              value={values.manualUrl}
              onChangeText={handleChange('manualUrl')}
              onBlur={() => setFieldTouched('manualUrl', true)}
              error={
                touched.manualUrl && typeof errors.manualUrl === 'string'
                  ? errors.manualUrl
                  : undefined
              }
            />

            <SelectableField
              label="Category"
              value={
                categories.find(
                  (c: EquipmentCategory) => c.id === values.categoryId,
                )?.name || 'Select Category'
              }
              onPress={() => setShowCategoryModal(true)}
            />

            <SelectableField
              label="Subcategory"
              value={
                subcategories.find(sc => sc.id === values.subcategoryId)
                  ?.name || 'Select Subcategory'
              }
              onPress={() => setShowSubcategoryModal(true)}
              disabled={!values.categoryId}
            />
            <ButtonRow>
              <Button text="Cancel" onPress={() => navigate('/equipment')} fullWidth/>
              <Button
                text="Update Equipment"
                onPress={handleSubmit}
                disabled={isSubmitting || !dirty}
                fullWidth
              />
            </ButtonRow>

            {/* Category Modal */}
            {showCategoryModal && (
              <ModalWrapper visible onClose={() => setShowCategoryModal(false)}>
                <Title text="Select Category" />
                <ClickableList
                  items={categories
                    .slice()
                    .sort((a: EquipmentCategory, b: EquipmentCategory) =>
                      a.name.localeCompare(b.name),
                    )
                    .map((cat: EquipmentCategory) => ({
                      id: cat.id,
                      label: cat.name,
                      onPress: () => {
                        setFieldValue('categoryId', cat.id);
                        setSelectedCategoryId(cat.id);
                        setFieldValue('subcategoryId', null);
                        setShowCategoryModal(false);
                      },
                    }))}
                />
                <DividerWithLabel label="OR" />
                <Button
                  text="Manage Categories"
                  onPress={() => {
                    setShowCategoryModal(false);
                    setShowManageCategoryModal(true);
                  }}
                />
              </ModalWrapper>
            )}

            {/* Subcategory Modal */}
            {showSubcategoryModal && (
              <ModalWrapper
                visible
                onClose={() => setShowSubcategoryModal(false)}>
                <Title
                  text={`Select Subcategory for ${
                    categories.find(
                      (cat: EquipmentCategory) => cat.id === selectedCategoryId,
                    )?.name || ''
                  }`}
                />
                <ClickableList
                  items={subcategories
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((sc: EquipmentSubcategory) => ({
                      id: sc.id,
                      label: sc.name,
                      onPress: () => {
                        setFieldValue('subcategoryId', sc.id);
                        setShowSubcategoryModal(false);
                      },
                    }))}
                />
                <DividerWithLabel label="OR" />
                <Button
                  text="Manage Subcategories"
                  onPress={() => {
                    setShowSubcategoryModal(false);
                    setShowManageSubcategoryModal(true);
                  }}
                />
              </ModalWrapper>
            )}

            {/* Manage Category Modal */}
            {showManageCategoryModal && (
              <ManageCategoriesModal
                visible
                mode="category"
                onClose={() => {
                  setShowManageCategoryModal(false);
                  refetchCategories();
                }}
                slugify={slugify}
                autoGenerateSlug
              />
            )}

            {/* Manage Subcategory Modal */}
            {showManageSubcategoryModal && values.categoryId && (
              <ManageCategoriesModal
                visible
                mode="subcategory"
                categoryId={values.categoryId}
                onClose={() => {
                  setShowManageSubcategoryModal(false);
                  refetchCategories();
                }}
                slugify={slugify}
                autoGenerateSlug
              />
            )}
          </>
        )}
      </Formik>
    </ScreenLayout>
  );
}
