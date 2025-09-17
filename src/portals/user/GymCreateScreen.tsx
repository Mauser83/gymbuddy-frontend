import { useMutation } from '@apollo/client';
import { Formik } from 'formik';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import React, { useEffect, useState } from 'react';
import { FlatList, Alert, View, Text } from 'react-native';
import { useNavigate } from 'react-router-native';
import * as Yup from 'yup';

import { useAuth } from 'features/auth/context/AuthContext';
import AddressAutocompleteInput, {
  AddressDetails,
} from 'features/gyms/components/AddressAutocompleteInput';
import { CREATE_GYM_MUTATION } from 'features/gyms/graphql/gym.mutations';
import Button from 'shared/components/Button';
import ButtonRow from 'shared/components/ButtonRow';
import Card from 'shared/components/Card';
import DetailField from 'shared/components/DetailField';
import FormInput from 'shared/components/FormInput';
import ScreenLayout from 'shared/components/ScreenLayout';
import { useTheme } from 'shared/theme/ThemeProvider';
import { spacing, fontSizes } from 'shared/theme/tokens';

countries.registerLocale(enLocale);

const StepLabels = ['Contact Info', 'Gym Profile', 'Address', 'Review'];

const labelMap: Record<string, string> = {
  name: 'Gym Name *',
  phone: 'Phone',
  email: 'Email',
  websiteUrl: 'Website URL',
  description: 'Description',
  imageUrl: 'Image URL',
};

const displayLabelMap: Record<string, string> = {
  name: 'Gym Name',
  phone: 'Phone',
  email: 'Email',
  websiteUrl: 'Website URL',
  description: 'Description',
  imageUrl: 'Image URL',
  state: 'State',
  city: 'City',
  address: 'Address',
  postalCode: 'Postal Code',
};

const hiddenFields = [
  'country',
  'countryCode',
  'state',
  'stateCode',
  'city',
  'postalCode',
  'latitude',
  'longitude',
];

const GymCreateScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [createGym, { loading }] = useMutation(CREATE_GYM_MUTATION);
  const [step, setStep] = useState(0);
  const [isAddressValid, setIsAddressValid] = useState(false);
  const colors = theme.colors;

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user]);

  const initialValues = {
    name: '',
    description: '',
    country: '',
    countryCode: '',
    state: '',
    stateCode: '',
    city: '',
    address: '',
    postalCode: '',
    latitude: '',
    longitude: '',
    websiteUrl: '',
    imageUrl: '',
    phone: '',
    email: '',
  };

  const stepSchemas = [
    Yup.object().shape({
      name: Yup.string().required('Name is required'),
      email: Yup.string().email('Invalid email'),
      phone: Yup.string(),
    }),
    Yup.object().shape({
      websiteUrl: Yup.string().url('Invalid URL'),
      description: Yup.string(),
      imageUrl: Yup.string().url('Invalid Image URL'),
    }),
    Yup.object().shape({
      address: Yup.string().required('Address is required'),
    }),
    Yup.object(),
  ];

  const getFormFields = (step: number) => {
    if (step === 0) {
      return ['name', 'email', 'phone'].map((key) => ({
        key,
        label: labelMap[key],
      }));
    } else if (step === 1) {
      return ['websiteUrl', 'description', 'imageUrl'].map((key) => ({
        key,
        label: labelMap[key],
      }));
    }
    return [];
  };

  const handleSubmit = async (values: typeof initialValues) => {
    const cleanedValues = Object.fromEntries(
      Object.entries(values).filter(([key, val]) => val !== ''),
    );
    try {
      const { data } = await createGym({ variables: { input: cleanedValues } });
      Alert.alert('✅ Gym Created');
      navigate(`/gym-admin/gyms/${data.createGym.id}`);
    } catch (err: any) {
      Alert.alert('❌ Error', err.message);
    }
  };

  return (
    <ScreenLayout scroll={false}>
      <Formik
        initialValues={initialValues}
        validationSchema={stepSchemas[step]}
        onSubmit={(values) => {
          if (step < 3) {
            setStep((prev) => prev + 1);
          } else {
            handleSubmit(values);
          }
        }}
      >
        {({
          handleChange,
          handleSubmit,
          values,
          errors,
          touched,
          setFieldTouched,
          setFieldValue,
          validateForm,
        }) => {
          return (
            <FlatList
              data={getFormFields(step)}
              keyExtractor={(item) => item.key}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <Card
                  variant="glass"
                  title="Create Gym"
                  text={`Step ${step + 1} of 4 — ${StepLabels[step]}`}
                  compact
                />
              }
              renderItem={({ item }) => (
                <View>
                  <FormInput
                    label={item.label}
                    placeholder={`Enter your ${item.label.replace(/\s\*$/, '').toLowerCase()}`}
                    onChangeText={handleChange(item.key)}
                    onBlur={() => setFieldTouched(item.key)}
                    value={values[item.key as keyof typeof values]}
                    error={
                      touched[item.key as keyof typeof touched] &&
                      errors[item.key as keyof typeof errors]
                        ? errors[item.key as keyof typeof errors]
                        : undefined
                    }
                  />
                </View>
              )}
              ListFooterComponent={
                <View>
                  {step === 2 && (
                    <>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          marginBottom: spacing.xs,
                          fontSize: fontSizes.lg,
                        }}
                      >
                        Address *
                      </Text>
                      <AddressAutocompleteInput
                        value={values.address}
                        onChangeText={(text) => setFieldValue('address', text)}
                        onPlaceSelect={(details: AddressDetails) => {
                          const countryName =
                            countries.getName(details.countryCode, 'en', {
                              select: 'official',
                            }) || details.country;

                          setFieldValue('address', details.address);
                          setFieldValue('latitude', details.latitude);
                          setFieldValue('longitude', details.longitude);
                          setFieldValue('postalCode', details.postalCode);
                          setFieldValue('country', countryName);
                          setFieldValue('countryCode', details.countryCode);
                          setFieldValue('state', details.state);
                          setFieldValue('stateCode', details.stateCode);
                          setFieldValue('city', details.city);
                        }}
                        onValidAddressSelected={setIsAddressValid}
                      />
                      {touched.address && errors.address && (
                        <Text
                          style={{
                            color: theme.colors.error,
                            marginBottom: spacing.xs,
                            fontSize: fontSizes.sm,
                          }}
                        >
                          {errors.address}
                        </Text>
                      )}
                    </>
                  )}

                  {step === 3 && (
                    <View style={{ gap: 12 }}>
                      {Object.entries(values)
                        .filter(
                          ([key, val]) =>
                            val?.toString().trim() !== '' && !hiddenFields.includes(key),
                        )
                        .map(([key, val], idx, arr) => (
                          <View key={key}>
                            <DetailField label={displayLabelMap[key] || key} value={val} />
                            {idx < arr.length && (
                              <View
                                style={{
                                  height: 1,
                                  backgroundColor: 'rgba(255,255,255,0.05)',
                                  marginVertical: 8,
                                }}
                              />
                            )}
                          </View>
                        ))}
                    </View>
                  )}

                  <ButtonRow>
                    {step > 0 ? (
                      <Button text="Back" fullWidth onPress={() => setStep((prev) => prev - 1)} />
                    ) : (
                      <View style={{ flex: 1 }} />
                    )}
                    <Button
                      disabled={
                        (step === 0 && !values.name.trim()) || (step === 2 && !isAddressValid)
                      }
                      fullWidth
                      onPress={() =>
                        validateForm().then((err) => {
                          if (Object.keys(err).length === 0) {
                            handleSubmit();
                          }
                        })
                      }
                      text={step === 3 ? 'Submit' : 'Next'}
                    />
                  </ButtonRow>
                </View>
              }
            />
          );
        }}
      </Formik>
    </ScreenLayout>
  );
};

export default GymCreateScreen;
