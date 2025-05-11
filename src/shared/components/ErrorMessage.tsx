import React from 'react';
import {Text, View, TextStyle, ViewStyle} from 'react-native';
import {useTheme} from 'shared/theme/ThemeProvider';

interface ErrorMessageProps {
  message: string;
  style?: TextStyle;
  containerStyle?: ViewStyle;
}

const ErrorMessage = ({message, style, containerStyle}: ErrorMessageProps) => {
  const {componentStyles} = useTheme();
  const styles = componentStyles.errorMessage;

  return (
    <View style={containerStyle}>
      <Text style={[styles.text, style]}>{message}</Text>
    </View>
  );
};

export default ErrorMessage;
