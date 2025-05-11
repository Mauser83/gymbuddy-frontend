// shared/components/ContentContainer.tsx
import React from 'react';
import {View, ViewStyle} from 'react-native';
import {useTheme} from 'shared/theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

const ContentContainer = ({children, style}: Props) => {
  const {theme} = useTheme();
  return (
    <View style={{backgroundColor: theme.colors.background, flex: 1}}>
      <View
        style={[
          {width: '100%', maxWidth: 400, alignSelf: 'center', flex: 1},
          style,
        ]}>
        {children}
      </View>
    </View>
  );
};

export default ContentContainer;
