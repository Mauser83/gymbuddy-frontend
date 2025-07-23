import React, {useRef, useEffect} from 'react';
import {
  ScrollView,
  View,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
} from 'react-native';
import {spacing} from 'shared/theme/tokens';

interface ExerciseCarouselProps {
  children: React.ReactNode[];
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
    scrollRef.current?.scrollTo({x: index * width, animated: false});
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
      {React.Children.map(children, (child, i) => (
        <View style={{width}} key={i}>
          {child}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {flexGrow: 0},
});