import { View } from 'react-native';
import Toast from 'react-native-toast-message';

const ToastContainer = () => (
  <View style={{ position: 'absolute', zIndex: 11, top: 0, left: 0, right: 0 }}>
    <Toast visibilityTime={5000} />
  </View>
);

export default ToastContainer;
