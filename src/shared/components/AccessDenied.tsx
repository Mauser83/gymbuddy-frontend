import React from 'react';

import Card from './Card';
import NoResults from './NoResults';
import ScreenLayout from './ScreenLayout';

const AccessDenied = () => (
  <ScreenLayout variant="centered">
    <Card variant="glass">
      <NoResults icon="🚫" message="Access denied" />
    </Card>
  </ScreenLayout>
);

export default AccessDenied;
