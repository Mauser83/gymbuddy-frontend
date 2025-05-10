import React from 'react';
import {View, Text} from 'react-native';
import {useTheme} from 'shared/theme/ThemeProvider';

interface TitleProps {
  text: string;
  subtitle?: string;
  align?: 'center' | 'left' | 'right';
}

const Title = ({text, subtitle, align = 'center'}: TitleProps) => {
  const {componentStyles} = useTheme();
  const styles = componentStyles.title;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { textAlign: align }]}>{text}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { textAlign: align }]}>{subtitle}</Text>
      )}
    </View>
  );
};

export default Title;
