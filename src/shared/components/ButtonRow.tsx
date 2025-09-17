import React from 'react';
import { View, ViewProps } from 'react-native';

import { spacing } from '../theme/tokens';

interface ButtonRowProps extends ViewProps {
  children: React.ReactNode;
}

const ButtonRow = ({ children, style, ...rest }: ButtonRowProps) => {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
};

export default ButtonRow;
