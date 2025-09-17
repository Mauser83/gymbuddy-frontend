import React from 'react';

import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';

export default function MessagesScreen() {
  return (
    <ScreenLayout scroll>
      <Title text="Messages" subtitle="TODO" />
    </ScreenLayout>
  );
}
