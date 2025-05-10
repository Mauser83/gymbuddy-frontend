import React from 'react';
import {Text} from 'react-native';
import {useTheme} from 'shared/theme/ThemeProvider';

interface FormErrorProps {
  message: string;
}

const FormError = ({message}: FormErrorProps) => {
  const {componentStyles} = useTheme();
  return <Text style={componentStyles.input.errorMessage}>{message}</Text>;
};

export default FormError;
