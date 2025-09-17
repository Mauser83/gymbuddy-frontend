import { Formik } from 'formik';
import React from 'react';
import { View, StyleSheet } from 'react-native'; // Import StyleSheet
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import * as Yup from 'yup';

import { useAuthService } from 'src/features/auth/hooks/useAuthService';
import Button from 'src/shared/components/Button';
import ButtonRow from 'src/shared/components/ButtonRow';
import Card from 'src/shared/components/Card';
import DividerWithLabel from 'src/shared/components/DividerWithLabel';
import FormError from 'src/shared/components/FormError';
import FormInput from 'src/shared/components/FormInput';
import ScreenLayout from 'src/shared/components/ScreenLayout';

// Validation Schema
const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

const LoginScreen = () => {
  const { login, loginLoading, loginError } = useAuthService();

  const errorMessage = loginError?.graphQLErrors?.map((e) => e.message).join(', ') || null;

  return (
    <ScreenLayout scroll variant="centered">
      <Card variant="glass" title="Login" compact />

      {errorMessage && <FormError message={errorMessage} />}

      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={LoginSchema}
        onSubmit={login}
      >
        {({ handleChange, handleSubmit, values, errors, touched, setFieldTouched }) => (
          // --- FIX APPLIED HERE ---
          // This View now stretches to fill the parent container's width
          <View style={styles.formContainer}>
            <FormInput
              label="Email"
              placeholder="Enter your email"
              value={values.email}
              onChangeText={handleChange('email')}
              onBlur={() => setFieldTouched('email', true)}
              error={touched.email ? errors.email : undefined}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <FormInput
              label="Password"
              placeholder="Enter your password"
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={() => setFieldTouched('password', true)}
              error={touched.password ? errors.password : undefined}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={() => handleSubmit()}
            />

            <View style={{ marginTop: 16 }}>
              <Button
                text={loginLoading ? 'Logging in...' : 'Login'}
                onPress={handleSubmit as any}
              />
            </View>

            <DividerWithLabel label="Or continue with" />

            <ButtonRow>
              <Button
                text="Google"
                onPress={() => {}}
                icon={<FontAwesome name="google" size={20} color="white" />}
                fullWidth
                disabled={true}
              />
              <Button
                text="Apple"
                onPress={() => {}}
                icon={<FontAwesome name="apple" size={20} color="white" />}
                fullWidth
                disabled={true}
              />
            </ButtonRow>
          </View>
        )}
      </Formik>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
  },
});

export default LoginScreen;
