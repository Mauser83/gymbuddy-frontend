// WebDraggableList.tsx
import React, { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  LinearTransition,
} from 'react-native-reanimated';

type DraggableItem = {
  instanceId: string;
  exerciseName: string;
};

type Props = {
  data: DraggableItem[];
  onDragEnd: (data: DraggableItem[]) => void;
  keyExtractor?: (item: DraggableItem) => string;
  renderItem: (params: { item: DraggableItem; index: number }) => React.ReactElement;
  ListHeaderComponent?: React.ReactElement;
  ListFooterComponent?: React.ReactElement;
};
export function WebDraggableList({
  data,
  onDragEnd,
  keyExtractor,
  renderItem,
  ListHeaderComponent,
  ListFooterComponent,
}: Props) {
  const [items, setItems] = useState(data);

  const updateOrder = (fromIndex: number, toIndex: number) => {
    const updated = [...items];
    const moved = updated.splice(fromIndex, 1)[0];
    updated.splice(toIndex, 0, moved);
    setItems(updated);
    onDragEnd(updated);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {ListHeaderComponent}

      {items.map((item, index) => (
        <DraggableRow
          key={keyExtractor ? keyExtractor(item) : item.instanceId}
          item={item}
          index={index}
          items={items}
          updateOrder={updateOrder}
          renderItem={renderItem}
        />
      ))}

      {ListFooterComponent}
    </ScrollView>
  );
}

function DraggableRow({
  item,
  index,
  items,
  updateOrder,
  renderItem,
}: {
  item: DraggableItem;
  index: number;
  items: DraggableItem[];
  updateOrder: (from: number, to: number) => void;
  renderItem: (params: { item: DraggableItem; index: number }) => React.ReactElement;
}) {
  const translateY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      // Find if item moved enough to reorder
      const itemHeight = 72; // Approx. height incl. margin/padding
      const newIndex = index + Math.round(translateY.value / itemHeight);

      const clampedIndex = Math.max(0, Math.min(items.length - 1, newIndex));
      if (clampedIndex !== index) {
        runOnJS(updateOrder)(index, clampedIndex);
      }

      translateY.value = 0;
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    zIndex: translateY.value !== 0 ? 10 : 0,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.row, style]} layout={LinearTransition.duration(200)}>
        {renderItem({ item, index })}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  row: {
    borderRadius: 8,
    elevation: 2,
  },
});
