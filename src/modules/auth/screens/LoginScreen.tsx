import React from 'react';
import {View} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {Formik} from 'formik';
import * as Yup from 'yup';
import {useAuthService} from '../hooks/useAuthService';
import Card from 'shared/components/Card';
import Button from 'shared/components/Button';
import FormInput from 'shared/components/FormInput';
import FormError from 'shared/components/FormError';
import DividerWithLabel from 'shared/components/DividerWithLabel';
import ScreenLayout from 'shared/components/ScreenLayout';
import ButtonRow from 'shared/components/ButtonRow';

// Validation Schema
const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

const LoginScreen = () => {
  const {login, loginLoading, loginError} = useAuthService();

  const errorMessage =
    loginError?.graphQLErrors?.map(e => e.message).join(', ') || null;

  return (
    <ScreenLayout variant="centered">
        <Card variant="glass" title="Login" compact />

        {errorMessage && <FormError message={errorMessage} />}

        <Formik
          initialValues={{email: '', password: ''}}
          validationSchema={LoginSchema}
          onSubmit={login}>
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
                label="Email"
                placeholder="Enter your email"
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={() => setFieldTouched('email', true)}
                error={touched.email ? errors.email : undefined}
                keyboardType="email-address"
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

              <View style={{marginTop: 16}}>
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
                  variant="solid"
                />
                <Button
                  text="Apple"
                  onPress={() => {}}
                  icon={<FontAwesome name="apple" size={20} color="white" />}
                  variant="solid"
                />
              </ButtonRow>
            </View>
          )}
        </Formik>
    </ScreenLayout>
  );
};

export default LoginScreen;
