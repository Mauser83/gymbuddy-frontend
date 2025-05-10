import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import RNModal from 'react-native-modal';
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
    <RNModal
      isVisible={visible}
      backdropColor="#000"
      backdropOpacity={backdropOpacity}
      onBackdropPress={onClose}
      style={styles.container}
    >
      <View style={[styles.card, style]}>
        {children}
      </View>
    </RNModal>
  );
};

export default ModalWrapper;
