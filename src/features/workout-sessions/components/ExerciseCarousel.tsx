import { Children, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  ScrollView,
  View,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
} from 'react-native';

import { spacing } from 'src/shared/theme/tokens';

interface ExerciseCarouselProps {
  children: ReactNode[];
  index?: number;
  onIndexChange?: (index: number) => void;
}

export default function ExerciseCarousel({
  children,
  index = 0,
  onIndexChange,
}: ExerciseCarouselProps) {
  const scrollRef = useRef<ScrollView>(null);
  const width = Dimensions.get('window').width - spacing.lg * 2;

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: index * width, animated: false });
    }, 0);
  }, [index, width]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (newIndex !== index) onIndexChange?.(newIndex);
  };

  return (
    <ScrollView
      horizontal
      pagingEnabled
      ref={scrollRef}
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={handleScrollEnd}
      style={styles.scroll}
    >
      {Children.map(children, (child, i) => (
        <View style={{ width }} key={i}>
          {child}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
});
