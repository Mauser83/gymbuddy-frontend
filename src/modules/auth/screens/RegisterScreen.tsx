import React from 'react';
import {View} from 'react-native';
import {Formik} from 'formik';
import * as Yup from 'yup';
import {useAuthService} from '../hooks/useAuthService';

import Card from 'shared/components/Card';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import FormError from 'shared/components/FormError';
import ScreenLayout from 'shared/components/ScreenLayout';

// Validation Schema
const RegisterSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .required('Username is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/,
      'Password must contain uppercase, lowercase, number, and special character',
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), undefined], 'Passwords must match')
    .required('Confirm Password is required'),
});

const RegisterScreen = () => {
  const {register, registerLoading, registerError} = useAuthService();

  const errorMessage =
    registerError?.graphQLErrors?.map(e => e.message).join(', ') || null;

  return (
    <ScreenLayout variant="centered">
        <Card variant="glass" title="Register" compact />

        {errorMessage && <FormError message={errorMessage} />}

        <Formik
          initialValues={{
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
          }}
          validationSchema={RegisterSchema}
          onSubmit={values => {
            const {confirmPassword, ...payload} = values;
            register(payload);
          }}>
          {({
            handleChange,
            handleSubmit,
            values,
            errors,
            touched,
            setFieldTouched,
          }) => (
            <View>
              <FormInput
                label="Username"
                placeholder="Enter username"
                value={values.username}
                onChangeText={handleChange('username')}
                onBlur={() => setFieldTouched('username', true)}
                error={touched.username ? errors.username : undefined}
              />

              <FormInput
                label="Email"
                placeholder="Enter email"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={() => setFieldTouched('email', true)}
                error={touched.email ? errors.email : undefined}
                keyboardType="email-address"
              />

              <FormInput
                label="Password"
                placeholder="Enter password"
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={() => setFieldTouched('password', true)}
                error={touched.password ? errors.password : undefined}
                secureTextEntry
                returnKeyType="next"
              />

              <FormInput
                label="Confirm Password"
                placeholder="Confirm password"
                value={values.confirmPassword}
                onChangeText={handleChange('confirmPassword')}
                onBlur={() => setFieldTouched('confirmPassword', true)}
                error={
                  touched.confirmPassword ? errors.confirmPassword : undefined
                }
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={() => handleSubmit()}
              />

              <View style={{marginTop: 16}}>
                <Button
                  text={registerLoading ? 'Registering...' : 'Register'}
                  onPress={handleSubmit as any}
                />
              </View>
            </View>
          )}
        </Formik>
    </ScreenLayout>
  );
};

export default RegisterScreen;
