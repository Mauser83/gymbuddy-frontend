import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation } from '@apollo/client';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { CREATE_GYM_MUTATION } from '../graphql/gym.mutations';
import { useNavigate } from 'react-router-native';
import { useAuth } from 'modules/auth/context/AuthContext';
import AddressAutocompleteInput, {
  AddressDetails,
} from 'modules/gym/components/AddressAutocompleteInput';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
countries.registerLocale(enLocale);

const StepLabels = ['Contact Info', 'Gym Profile', 'Address', 'Review'];

const labelMap: Record<string, string> = {
  name: 'Gym Name',
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
  country: 'Country',
  state: 'State',
  city: 'City',
  address: 'Address',
  postalCode: 'Postal Code',
};

const hiddenFields = [
  'countryCode',
  'stateCode',
  'latitude',
  'longitude',
];

const GymCreateScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [createGym, { loading }] = useMutation(CREATE_GYM_MUTATION);
  const [step, setStep] = useState(0);
  const [isAddressValid, setIsAddressValid] = useState(false);

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
      return ['name', 'email', 'phone'].map(key => ({
        key,
        label: labelMap[key],
      }));
    } else if (step === 1) {
      return ['websiteUrl', 'description', 'imageUrl'].map(key => ({
        key,
        label: labelMap[key],
      }));
    }
    return [];
  };

  const handleSubmit = async (values: typeof initialValues) => {
    const cleanedValues = Object.fromEntries(
      Object.entries(values).filter(([key, val]) => val !== '')
    );
    try {
      const { data } = await createGym({ variables: { input: cleanedValues } });
      Alert.alert('✅ Gym Created');
      navigate(`/gyms/${data.createGym.id}`);
    } catch (err: any) {
      Alert.alert('❌ Error', err.message);
    }
  };

  return (
    <LinearGradient colors={['#0f172a', '#1f2937']} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Formik
  initialValues={initialValues}
  validationSchema={stepSchemas[step]}
  onSubmit={values => {
    if (step < 3) {
      setStep(prev => prev + 1);
    } else {
      handleSubmit(values);
    }
  }}
>
  {({
    handleChange,
    handleBlur,
    handleSubmit,
    values,
    errors,
    touched,
    setFieldValue,
    validateForm,
  }) => {
    return (
      <FlatList
        data={getFormFields(step)}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.container}>
            <View style={styles.glassCard}>
              <Text style={styles.headerText}>Create Gym</Text>
              <Text style={styles.stepLabel}>
                Step {step + 1} of 4 — {StepLabels[step]}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.container}>
            <Text style={styles.inputLabel}>{item.label}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={item.label}
              placeholderTextColor="#9ca3af"
              onChangeText={handleChange(item.key)}
              onBlur={handleBlur(item.key)}
              value={values[item.key as keyof typeof values]}
            />
            {touched[item.key as keyof typeof touched] &&
              errors[item.key as keyof typeof errors] && (
                <Text style={styles.errorMessage}>
                  {errors[item.key as keyof typeof errors]}
                </Text>
              )}
          </View>
        )}
        ListFooterComponent={
          <View style={styles.container}>
            {step === 2 && (
              <>
                <Text style={styles.inputLabel}>Address *</Text>
                <AddressAutocompleteInput
                  value={values.address}
                  onChangeText={text => setFieldValue('address', text)}
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
                  <Text style={styles.errorMessage}>
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
                      val?.toString().trim() !== '' &&
                      !hiddenFields.includes(key)
                  )
                  .map(([key, val], idx, arr) => (
                    <View key={key}>
                      <Text style={{ color: '#fff' }}>
                        {displayLabelMap[key] || key}: {val}
                      </Text>
                      {idx < arr.length - 1 && (
                        <View
                          style={{
                            height: 1,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            marginVertical: 4,
                          }}
                        />
                      )}
                    </View>
                  ))}
              </View>
            )}

            <View style={styles.buttonRow}>
              {step > 0 && (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => setStep(prev => prev - 1)}
                >
                  <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  ((step === 0 && !values.name.trim()) ||
                    (step === 2 && !isAddressValid)) && {
                    opacity: 0.5,
                  },
                ]}
                disabled={
                  (step === 0 && !values.name.trim()) ||
                  (step === 2 && !isAddressValid)
                }
                onPress={() =>
                  validateForm().then(err => {
                    if (Object.keys(err).length === 0) {
                      handleSubmit();
                    }
                  })
                }
              >
                <Text style={styles.buttonText}>
                  {step === 3 ? 'Submit' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    );
  }}
</Formik>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default GymCreateScreen;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingBottom: 100,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f9fafb',
  },
  stepLabel: {
    fontSize: 16,
    color: '#f9fafb',
    marginTop: 8,
  },
  inputLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#f9fafb',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderColor: 'rgba(255, 165, 0, 0.2)',
  },
  errorMessage: {
    color: '#f87171',
    fontSize: 11,
    marginTop: -12,
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: '#f97316',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 100,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 24,
  },
});
