import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Formik} from 'formik';
import * as Yup from 'yup';
import {useAuthService} from '../hooks/useAuthService';

import Card from 'shared/components/Card';
import Input from 'shared/components/Input';
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
      <View style={styles.container}>
        <Card variant="glass" title="Register" text="" compact />

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
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
          }) => (
            <View style={styles.form}>
              <Input
                label="Username"
                placeholder="Enter username"
                value={values.username}
                onChangeText={handleChange('username')}
                onBlur={() => handleBlur('username')}
                error={touched.username ? errors.username : undefined}
              />

              <Input
                label="Email"
                placeholder="Enter email"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={() => handleBlur('email')}
                error={touched.email ? errors.email : undefined}
                keyboardType="email-address"
              />

              <Input
                label="Password"
                placeholder="Enter password"
                value={values.password}
                onChangeText={handleChange('password')}
                onBlur={() => handleBlur('password')}
                error={touched.password ? errors.password : undefined}
                secureTextEntry
                returnKeyType="next"
              />

              <Input
                label="Confirm Password"
                placeholder="Confirm password"
                value={values.confirmPassword}
                onChangeText={handleChange('confirmPassword')}
                onBlur={() => handleBlur('confirmPassword')}
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
      </View>
    </ScreenLayout>
  );
};

export default RegisterScreen;

// Layout styles only
const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 400,
  },
  form: {
    width: '100%',
  },
});
