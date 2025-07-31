import React, {useState} from 'react';
import {View, ScrollView, Dimensions} from 'react-native';
import {Formik} from 'formik';
import * as Yup from 'yup';

import FormInput from 'shared/components/FormInput';
import SelectableField from 'shared/components/SelectableField';
import Button from 'shared/components/Button';
import ButtonRow from 'shared/components/ButtonRow';
import ModalWrapper from 'shared/components/ModalWrapper';
import ClickableList from 'shared/components/ClickableList';
import Title from 'shared/components/Title';
import DividerWithLabel from 'shared/components/DividerWithLabel';

import {
  EquipmentCategory,
  EquipmentSubcategory,
} from 'features/equipment/types/equipment.types';

const screenHeight = Dimensions.get('window').height;
const modalHeight = screenHeight * 0.8;

const EquipmentSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  brand: Yup.string().required('Brand is required'),
  description: Yup.string(),
  manualUrl: Yup.string().url('Must be a valid URL'),
  categoryId: Yup.number().required('Category is required'),
  subcategoryId: Yup.number().nullable(),
});

export default function EquipmentForm({
  initialValues,
  onSubmit,
  categories,
  submitLabel,
  submitting,
  cancelLabel,
  onCancel,
}: {
  initialValues: any;
  onSubmit: (values: any, helpers: any) => void;
  categories: EquipmentCategory[];
  submitLabel: string;
  submitting: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    initialValues.categoryId || null,
  );
  const [activeModal, setActiveModal] = useState<
    null | 'category' | 'subcategory'
  >(null);

  const subcategories: EquipmentSubcategory[] =
    categories.find(cat => cat.id === selectedCategoryId)?.subcategories ?? [];

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={EquipmentSchema}
      onSubmit={onSubmit}
      enableReinitialize>
      {({
        values,
        errors,
        touched,
        handleChange,
        handleSubmit,
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
              categories.find(c => c.id === values.categoryId)?.name ||
              'Select Category'
            }
            onPress={() => setActiveModal('category')}
          />

          <SelectableField
            label="Subcategory"
            value={
              subcategories.find(sc => sc.id === values.subcategoryId)?.name ||
              'Select Subcategory'
            }
            onPress={() => setActiveModal('subcategory')}
            disabled={!values.categoryId}
          />

          <ButtonRow>
            {onCancel && (
              <Button
                text={cancelLabel || 'Cancel'}
                fullWidth
                onPress={onCancel}
              />
            )}
            <Button
              text={submitLabel}
              onPress={handleSubmit}
              disabled={
                submitting ||
                (submitLabel.toLowerCase().includes('update') && !dirty)
              }
              fullWidth
            />
          </ButtonRow>

          <ModalWrapper
            visible={!!activeModal}
            onClose={() => setActiveModal(null)}>
            {activeModal === 'category' && (
              <>
                <View style={{padding: 16}}>
                  <Title text="Select Category" />
                </View>
                <ScrollView
                  style={{maxHeight: modalHeight - 200}}
                  contentContainerStyle={{paddingHorizontal: 16}}>
                  <ClickableList
                    items={categories.map(cat => ({
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
                    text="Back"
                    fullWidth
                    onPress={() => setActiveModal(null)}
                  />
                </View>
              </>
            )}

            {activeModal === 'subcategory' && (
              <>
                <View style={{padding: 16}}>
                  <Title
                    text={`Select Subcategory for ${
                      categories.find(cat => cat.id === selectedCategoryId)
                        ?.name || ''
                    }`}
                  />
                </View>
                <ScrollView
                  style={{maxHeight: modalHeight - 200}}
                  contentContainerStyle={{paddingHorizontal: 16}}>
                  <ClickableList
                    items={subcategories.map(sc => ({
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
                    text="Back"
                    fullWidth
                    onPress={() => setActiveModal(null)}
                  />
                </View>
              </>
            )}
          </ModalWrapper>
        </>
      )}
    </Formik>
  );
}
