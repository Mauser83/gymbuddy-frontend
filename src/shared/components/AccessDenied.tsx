import React from 'react';
import ScreenLayout from './ScreenLayout';
import Card from './Card';
import NoResults from './NoResults';

const AccessDenied = () => (
  <ScreenLayout variant="centered">
    <Card variant="glass">
      <NoResults icon="🚫" message="Access denied" />
    </Card>
  </ScreenLayout>
);

export default AccessDenied;