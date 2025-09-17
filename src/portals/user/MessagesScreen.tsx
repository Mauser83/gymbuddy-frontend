import React from 'react';

import ScreenLayout from 'src/shared/components/ScreenLayout';
import Title from 'src/shared/components/Title';

export default function MessagesScreen() {
  return (
    <ScreenLayout scroll>
      <Title text="Messages" subtitle="TODO" />
    </ScreenLayout>
  );
}
