import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

import { DraggableItem, DraggableItemProps, DragData } from './DraggableItem';

type WritableRef<T> = { current: T };

export type Layout = { x: number; y: number; width: number; height: number };

export type MeasuredDraggableItemProps = {
  id: string;
  type: DragData['type'];
  onDrop: DraggableItemProps['onDrop'];
  children: React.ReactNode;
  onDragStart?: DraggableItemProps['onDragStart'];
  onDragEnd?: DraggableItemProps['onDragEnd'];
  onDragMove?: DraggableItemProps['onDragMove'];
  layoutStore: WritableRef<Record<string, Layout>>;
  offsetStore: WritableRef<Record<string, SharedValue<number>>>;
  isDraggingShared: SharedValue<boolean>;
  draggedItemId: SharedValue<string | null>;
  draggedItemType: SharedValue<'exercise' | 'group' | null>;
  pointerPositionY: SharedValue<number>;
  scrollOffset: SharedValue<number>;
  layoutVersion: number;
  scrollLayoutVersion: number;
  simultaneousHandlers?: any;
};

export const MeasuredDraggableItem = forwardRef<
  { measure: () => void },
  MeasuredDraggableItemProps
>(
  (
    {
      id,
      type,
      onDrop,
      children,
      onDragStart,
      onDragEnd,
      onDragMove,
      layoutStore,
      offsetStore,
      isDraggingShared,
      draggedItemId,
      draggedItemType,
      pointerPositionY,
      scrollOffset,
      layoutVersion,
      scrollLayoutVersion,
      simultaneousHandlers,
    },
    ref,
  ) => {
    const innerRef = useRef<View>(null);
    const offset = useSharedValue(0);

    useEffect(() => {
      offsetStore.current[id] = offset;
      const currentOffsetStore = offsetStore.current;
      const currentLayoutStore = layoutStore.current;

      return () => {
        delete currentOffsetStore[id];
        delete currentLayoutStore[id];
      };
    }, [id, offset, offsetStore, layoutStore]);

    const measure = useCallback(() => {
      innerRef.current?.measure((x, y, width, height, pageX, pageY) => {
        if (width > 0 && height > 0) {
          layoutStore.current[id] = { x: pageX, y: pageY, width, height };
          offset.value = 0;
        }
      });
    }, [id, layoutStore, offset]);

    useImperativeHandle(ref, () => ({ measure }));

    useEffect(() => {
      measure();
    }, [id, layoutVersion, scrollLayoutVersion, measure]);

    const animatedContainerStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: offset.value }],
    }));

    return (
      <Animated.View
        ref={innerRef}
        onLayout={measure}
        style={animatedContainerStyle}
        collapsable={false}
      >
        <DraggableItem
          item={{ type, id }}
          onDrop={onDrop}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragMove={onDragMove}
          isDraggingShared={isDraggingShared}
          draggedItemId={draggedItemId}
          draggedItemType={draggedItemType}
          pointerPositionY={pointerPositionY}
          scrollOffset={scrollOffset}
          simultaneousHandlers={simultaneousHandlers}
        >
          {children}
        </DraggableItem>
      </Animated.View>
    );
  },
);

MeasuredDraggableItem.displayName = 'MeasuredDraggableItem';
