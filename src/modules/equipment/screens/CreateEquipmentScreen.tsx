import React, {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-native';
import {Formik} from 'formik';
import * as Yup from 'yup';

import {useEquipment} from '../hooks/useEquipment';
import {
  EquipmentCategory,
  EquipmentSubcategory,
} from '../types/equipment.types';
import { useAuth } from 'modules/auth/context/AuthContext';

import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import SelectableField from 'shared/components/SelectableField';
import OptionItem from 'shared/components/OptionItem';
import ModalWrapper from 'shared/components/ModalWrapper';
import {ScrollView} from 'react-native';

const EquipmentSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  brand: Yup.string().required('Brand is required'),
  description: Yup.string(),
  manualUrl: Yup.string().url('Must be a valid URL'),
  categoryId: Yup.number().required('Category is required'),
  subcategoryId: Yup.number().nullable(),
});

export default function CreateEquipmentScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {getCategories, createEquipment} = useEquipment();
  const {data: categoryData} = getCategories();
  const categories = categoryData?.equipmentCategories ?? [];

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);

    useEffect(() => {
      if (!user) navigate('/');
    }, [user]);

  const subcategories: EquipmentSubcategory[] =
  categories.find((cat: EquipmentCategory) => cat.id === selectedCategoryId)?.subcategories ?? [];

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
      await createEquipment({variables: {input: values}});
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
                categories.find((c: EquipmentCategory) => c.id === values.categoryId) ||
                'Select Category'
              }
              onPress={() => setShowCategoryModal(true)}
            />

            <SelectableField
              label="Subcategory"
              value={
                subcategories.find((sc: EquipmentSubcategory) => sc.id === values.subcategoryId)
                  ?.name || 'Select Subcategory'
              }
              onPress={() => setShowSubcategoryModal(true)}
              disabled={!values.categoryId}
            />

            <Button
              text="Create Equipment"
              onPress={handleSubmit}
              disabled={isSubmitting}
            />

            {/* Category Modal */}
            {showCategoryModal && (
              <ModalWrapper visible onClose={() => setShowCategoryModal(false)}>
                <ScrollView>
                  {categories.map((cat: EquipmentCategory) => (
                    <OptionItem
                      key={cat.id}
                      text={cat.name}
                      onPress={() => {
                        setFieldValue('categoryId', cat.id);
                        setSelectedCategoryId(cat.id);
                        setFieldValue('subcategoryId', null);
                        setShowCategoryModal(false);
                      }}
                    />
                  ))}
                </ScrollView>
              </ModalWrapper>
            )}

            {/* Subcategory Modal */}
            {showSubcategoryModal && (
              <ModalWrapper
                visible
                onClose={() => setShowSubcategoryModal(false)}>
                <ScrollView>
                  {subcategories.map((sc: EquipmentSubcategory) => (
                    <OptionItem
                      key={sc.id}
                      text={sc.name}
                      onPress={() => {
                        setFieldValue('subcategoryId', sc.id);
                        setShowSubcategoryModal(false);
                      }}
                    />
                  ))}
                </ScrollView>
              </ModalWrapper>
            )}
          </>
        )}
      </Formik>
    </ScreenLayout>
  );
}
