import React from 'react';
import {
  Modal,
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from 'shared/theme/ThemeProvider';

interface ModalWrapperProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  backdropOpacity?: number;
}

const ModalWrapper = ({
  visible,
  onClose,
  children,
  style,
  backdropOpacity = 0.5,
}: ModalWrapperProps) => {
  const { componentStyles } = useTheme();
  const styles = componentStyles.modalWrapper;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[internalStyles.backdrop, { backgroundColor: `rgba(0,0,0,${backdropOpacity})` }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.card, style]}>
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const internalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ModalWrapper;
