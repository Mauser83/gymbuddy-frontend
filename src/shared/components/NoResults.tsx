import React from 'react';
import {View, Text} from 'react-native';
import {useTheme} from 'shared/theme/ThemeProvider';

interface NoResultsProps {
  message: string;
  icon?: string; // Optional emoji
}

const NoResults = ({message, icon = '😕'}: NoResultsProps) => {
  const {componentStyles} = useTheme();
  const styles = componentStyles.noResults;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {icon} {message}
      </Text>
    </View>
  );
};

export default NoResults;
