// Adds ManageCategoriesModal support inside the category selector modal
// Slugs are now automatically generated from names (no slug input needed)
import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-native';
import {Formik} from 'formik';
import * as Yup from 'yup';

import {useEquipment} from '../hooks/useEquipment';
import {
  EquipmentCategory,
  EquipmentSubcategory,
} from '../types/equipment.types';
import {useAuth} from 'modules/auth/context/AuthContext';

import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import SelectableField from 'shared/components/SelectableField';
import ModalWrapper from 'shared/components/ModalWrapper';
import ManageCategoriesModal from './ManageCategoriesModal';
import {ScrollView, Dimensions, View} from 'react-native';
import ClickableList from 'shared/components/ClickableList';
import DividerWithLabel from 'shared/components/DividerWithLabel';

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

export default function CreateEquipmentScreen() {
  const {user} = useAuth();
  const navigate = useNavigate();
  const screenHeight = Dimensions.get('window').height;
  const modalHeight = screenHeight * 0.8;

  const {getCategories, createEquipment} = useEquipment();
  const {data: categoryData, refetch: refetchCategories} = getCategories();
  const categories = categoryData?.equipmentCategories ?? [];

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [activeModal, setActiveModal] = useState<
    null | 'category' | 'subcategory'
  >(null);

  const [showManageCategoryModal, setShowManageCategoryModal] = useState(false);
  const [showManageSubcategoryModal, setShowManageSubcategoryModal] =
    useState(false);

  useEffect(() => {
    if (!user) navigate('/');
  }, [user]);

  const subcategories: EquipmentSubcategory[] =
    categories.find((cat: EquipmentCategory) => cat.id === selectedCategoryId)
      ?.subcategories ?? [];

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
    {setSubmitting}: {setSubmitting: (isSubmitting: boolean) => void},
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

      <Formik
        initialValues={initialValues}
        validationSchema={EquipmentSchema}
        onSubmit={handleSubmit}>
        {({
          values,
          errors,
          touched,
          handleChange,
          handleSubmit,
          isSubmitting,
          setFieldValue,
          setFieldTouched,
        }) => (
          <>
            <FormInput
              label="Name"
              placeholder="Enter equipment name"
              value={values.name}
              onChangeText={handleChange('name')}
              onBlur={() => setFieldTouched('name', true)}
              error={touched.name ? errors.name : undefined}
            />

            <FormInput
              label="Description"
              placeholder="Enter description (optional)"
              value={values.description}
              onChangeText={handleChange('description')}
              onBlur={() => setFieldTouched('description', true)}
              error={touched.description ? errors.description : undefined}
            />

            <FormInput
              label="Brand"
              placeholder="Enter brand"
              value={values.brand}
              onChangeText={handleChange('brand')}
              onBlur={() => setFieldTouched('brand', true)}
              error={touched.brand ? errors.brand : undefined}
            />

            <FormInput
              label="Manual URL"
              placeholder="https://example.com/manual"
              value={values.manualUrl}
              onChangeText={handleChange('manualUrl')}
              onBlur={() => setFieldTouched('manualUrl', true)}
              error={touched.manualUrl ? errors.manualUrl : undefined}
            />

            <SelectableField
              label="Category"
              value={
                categories.find(
                  (c: EquipmentCategory) => c.id === values.categoryId,
                )?.name || 'Select Category'
              }
              onPress={() => setActiveModal('category')}
            />

            <SelectableField
              label="Subcategory"
              value={
                subcategories.find(
                  (sc: EquipmentSubcategory) => sc.id === values.subcategoryId,
                )?.name || 'Select Subcategory'
              }
              onPress={() => setActiveModal('subcategory')}
              disabled={!values.categoryId}
            />

            <Button
              text="Create Equipment"
              onPress={handleSubmit}
              disabled={isSubmitting}
            />

            {/* Category Modal */}
            <ModalWrapper
              visible={!!activeModal}
              onClose={() => setActiveModal(null)}>
              {activeModal === 'category' && (
                <>
                  <View style={{padding: 16}}>
                    <Title text="Select Category" />
                  </View>
                  <ScrollView
                    style={{maxHeight: modalHeight - 275}}
                    contentContainerStyle={{paddingHorizontal: 16}}>
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
                            setActiveModal(null);
                          },
                        }))}
                    />
                  </ScrollView>
                  <DividerWithLabel label="OR" />
                  <View style={{padding: 16}}>
                    <Button
                      text="Manage Categories"
                      onPress={() => {
                        setActiveModal(null);
                        setShowManageCategoryModal(true);
                      }}
                    />
                  </View>
                </>
              )}

              {activeModal === 'subcategory' && (
                <>
                  <View style={{padding: 16}}>
                    <Title
                      text={`Select Subcategory for ${
                        categories.find(
                          (cat: EquipmentCategory) =>
                            cat.id === selectedCategoryId,
                        )?.name || ''
                      }`}
                    />
                  </View>

                  <ScrollView
                    style={{maxHeight: modalHeight - 275}}
                    contentContainerStyle={{paddingHorizontal: 16}}>
                    <ClickableList
                      items={subcategories
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((sc: EquipmentSubcategory) => ({
                          id: sc.id,
                          label: sc.name,
                          onPress: () => {
                            setFieldValue('subcategoryId', sc.id);
                            setActiveModal(null);
                          },
                        }))}
                    />
                  </ScrollView>
                  <DividerWithLabel label="OR" />
                  <View style={{padding: 16}}>
                    <Button
                      text="Manage Subcategories"
                      onPress={() => {
                        setActiveModal(null);
                        setShowManageSubcategoryModal(true);
                      }}
                    />
                  </View>
                </>
              )}
            </ModalWrapper>

            {/* Manage Categories Modal */}
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

            {/* Manage Subcategories Modal */}
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
