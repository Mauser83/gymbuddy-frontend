import React from 'react';
import ModalWrapper from './ModalWrapper';
import OptionItem from 'shared/components/OptionItem';
import {Text, View} from 'react-native';
import {spacing} from 'shared/theme/tokens';

interface OptionModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
  onClose: () => void;
}

const OptionModal: React.FC<OptionModalProps> = ({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}) => {
  return (
    <ModalWrapper visible={visible} onClose={onClose}>
      <View style={{padding: spacing.md}}>
        <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: spacing.md}}>{title}</Text>
        {options.map(option => (
          <OptionItem
            key={option}
            text={option}
            onPress={() => onSelect(option)}
            selected={option === selected}
          />
        ))}
      </View>
    </ModalWrapper>
  );
};

export default OptionModal;
