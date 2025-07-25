import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useTheme} from 'shared/theme/ThemeProvider';
import Title from 'shared/components/Title';

interface ExerciseNavHeaderProps {
  title: string;
  showPrev: boolean;
  showNext: boolean;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function ExerciseNavHeader({
  title,
  showPrev,
  showNext,
  onPrev,
  onNext,
}: ExerciseNavHeaderProps) {
  const {theme} = useTheme();
  return (
    <View style={styles.container}>
      <Title text={title} />
      {showPrev && (
        <TouchableOpacity
          onPress={onPrev}
          style={[styles.chevron, styles.left]}>
          <FontAwesome
            name="chevron-left"
            size={20}
            color={theme.colors.accentStart}
          />
        </TouchableOpacity>
      )}
      {showNext && (
        <TouchableOpacity
          onPress={onNext}
          style={[styles.chevron, styles.right]}>
          <FontAwesome
            name="chevron-right"
            size={20}
            color={theme.colors.accentStart}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  chevron: {
    padding: 4,
    position: 'absolute',
    top: 0,
  },
  left: {
    left: -20,
  },
  right: {
    right: -20,
  },
});