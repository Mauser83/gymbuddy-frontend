import {Alert} from 'react-native';

export const confirmAsync = (title: string, message: string) =>
  new Promise<boolean>(resolve => {
    Alert.alert(title, message, [
      {text: 'Cancel', style: 'cancel', onPress: () => resolve(false)},
      {text: 'Continue', onPress: () => resolve(true)},
    ]);
  });