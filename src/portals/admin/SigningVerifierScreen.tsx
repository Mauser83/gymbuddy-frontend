import React from 'react';
import {Text} from 'react-native';
import ScreenLayout from 'shared/components/ScreenLayout';
import Card from 'shared/components/Card';
import Title from 'shared/components/Title';

const SigningVerifierScreen = () => (
  <ScreenLayout scroll>
    <Card variant="glass">
      <Title text="Signing Verifier" subtitle="Validate signatures" />
      <Text>Coming soon.</Text>
    </Card>
  </ScreenLayout>
);

export default SigningVerifierScreen;