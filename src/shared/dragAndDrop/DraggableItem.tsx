import React, {useState, useRef} from 'react';
import {View, Platform} from 'react-native';
import type {PointerEvent} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  useDerivedValue,
  useAnimatedReaction,
} from 'react-native-reanimated';

export type DragData = {type: 'exercise' | 'group'; id: string};

export type DraggableItemProps = {
  item: DragData;
  children: React.ReactNode;
  onDrop: (x: number, y: number, data: DragData) => void;
  onDragStart?: (data: DragData) => void;
  onDragEnd?: () => void;
  onDragMove?: (x: number, y: number, data: DragData) => void;
  isDraggingShared: Animated.SharedValue<boolean>;
  draggedItemId: Animated.SharedValue<string | null>;
  draggedItemType: Animated.SharedValue<'exercise' | 'group' | null>;
  pointerPositionY: Animated.SharedValue<number>;
  simultaneousHandlers?: any;
  scrollOffset?: Animated.SharedValue<number>;
};

const NativeDraggableItem: React.FC<DraggableItemProps> = ({
  item,
  children,
  onDrop,
  onDragStart,
  onDragEnd,
  onDragMove,
  isDraggingShared,
  draggedItemId,
  draggedItemType,
  pointerPositionY,
  simultaneousHandlers,
  scrollOffset,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startScrollY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const [layoutSize, setLayoutSize] = useState<{width: number; height: number}>(
    {width: 0, height: 0},
  );

  const handleTouchStart = () => {
    onDragStart?.(item);
  };

  const handleTouchEnd = () => {
    onDragEnd?.();
  };

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    {startX: number; startY: number; startScrollY: number}
  >({
    onBegin: () => {
      isDragging.value = true;
      isDraggingShared.value = true;
      draggedItemId.value = item.id;
      draggedItemType.value = item.type;
      startScrollY.value = scrollOffset?.value ?? 0;
    },
    onStart: (_, ctx) => {
      isDragging.value = true;
      isDraggingShared.value = true;
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
      startScrollY.value = scrollOffset?.value ?? 0;
    },
    onActive: (event, ctx) => {
      const liveScrollOffset = scrollOffset?.value ?? 0;
      const scrollDelta = liveScrollOffset - startScrollY.value;
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY + scrollDelta;
      pointerPositionY.value = event.absoluteY;
      if (onDragMove) {
        onDragMove(event.absoluteX, event.absoluteY, item);
      }
    },
    onEnd: event => {
      runOnJS(onDrop)(event.absoluteX, event.absoluteY, item);
      translateX.value = 0;
      translateY.value = 0;
      isDragging.value = false;
      isDraggingShared.value = false;
      draggedItemId.value = null;
      draggedItemType.value = null;
      runOnJS(handleTouchEnd)();
    },
  });

  const isActive = useDerivedValue(
    () => draggedItemId.value === item.id && draggedItemType.value === item.type,
    [draggedItemId, draggedItemType],
  );

  const animatedStyle = useAnimatedStyle(() => {
    const scrollDiff = isActive.value ? (scrollOffset?.value ?? 0) - startScrollY.value : 0;
    return {
      position: isActive.value ? 'absolute' : 'relative',
      zIndex: isActive.value ? 100 : 0,
      opacity: isActive.value ? 0.7 : 1,
      transform: [
        {translateX: translateX.value},
        {translateY: translateY.value + scrollDiff},
      ],
      elevation: isActive.value ? 10 : 0,
      shadowRadius: isActive.value ? 15 : 1,
      shadowOpacity: isActive.value ? 0.7 : 0,
      shadowOffset: {width: 0, height: isActive.value ? 10 : 1},
    } as any;
  });

  return (
    <View style={{width: '100%', height: layoutSize.height > 0 ? layoutSize.height : undefined}}>
      <PanGestureHandler onGestureEvent={gestureHandler} simultaneousHandlers={simultaneousHandlers}>
        <Animated.View
          onLayout={e =>
            setLayoutSize({width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height})
          }
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={[animatedStyle, {width: '100%'}]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const WebDraggableItem: React.FC<DraggableItemProps> = ({
  item,
  children,
  onDrop,
  onDragStart,
  onDragEnd,
  onDragMove,
  isDraggingShared,
  draggedItemId,
  draggedItemType,
  pointerPositionY,
  scrollOffset,
}) => {
  const [layoutSize, setLayoutSize] = useState<{width: number; height: number}>({width: 0, height: 0});
  const [isDragging, setIsDragging] = useState(false);
  const [scrollOffsetVal, setScrollOffsetVal] = useState(0);
  const [isActiveWeb, setIsActiveWeb] = useState(false);
  const translate = useRef({x: 0, y: 0});
  const start = useRef({x: 0, y: 0});
  const startScrollY = useRef(0);
  const hasMoved = useRef(false);
  const dragThreshold = 5;

  useAnimatedReaction(
    () => scrollOffset?.value ?? 0,
    val => {
      runOnJS(setScrollOffsetVal)(val);
    },
    [scrollOffset],
  );

  useAnimatedReaction(
    () => draggedItemId.value === item.id && draggedItemType.value === item.type,
    val => {
      runOnJS(setIsActiveWeb)(val);
    },
    [draggedItemId, draggedItemType],
  );

  const handlePointerDown = (e: PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const evt = e as unknown as {clientX: number; clientY: number; pointerId: number; currentTarget: any};
    setIsDragging(true);
    isDraggingShared.value = true;
    draggedItemId.value = item.id;
    draggedItemType.value = item.type;
    start.current = {x: evt.clientX - translate.current.x, y: evt.clientY - translate.current.y};
    startScrollY.current = scrollOffsetVal;
    hasMoved.current = false;
    onDragStart?.(item);
    evt.currentTarget.setPointerCapture(evt.pointerId);
  };

  const handlePointerMove = (e: PointerEvent) => {
    e.stopPropagation();
    const evt = e as unknown as {clientX: number; clientY: number; currentTarget: any};
    if (!isDragging) return;
    const dx = evt.clientX - start.current.x;
    const dy = evt.clientY - start.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (!hasMoved.current && distance > dragThreshold) {
      hasMoved.current = true;
    }
    if (!hasMoved.current) return;
    translate.current = {x: dx, y: dy};
    const scrollDiff = scrollOffsetVal - startScrollY.current;
    evt.currentTarget.style.transform = `translate(${dx}px, ${dy + scrollDiff}px)`;
    pointerPositionY.value = evt.clientY;
    onDragMove?.(evt.clientX, evt.clientY, item);
  };

  const endDrag = (e: PointerEvent) => {
    e.stopPropagation();
    const evt = e as unknown as {clientX: number; clientY: number; pointerId: number; currentTarget: any};
    if (!isDragging) return;
    evt.currentTarget.releasePointerCapture(evt.pointerId);
    setIsDragging(false);
    isDraggingShared.value = false;
    draggedItemId.value = null;
    draggedItemType.value = null;
    translate.current = {x: 0, y: 0};
    evt.currentTarget.style.transform = 'translate(0px, 0px)';
    if (hasMoved.current) {
      onDrop(evt.clientX, evt.clientY, item);
    }
    hasMoved.current = false;
    onDragEnd?.();
  };

  return (
    <View style={{width: '100%', height: layoutSize.height > 0 ? layoutSize.height : undefined}}>
      <View
        onLayout={e => setLayoutSize({width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height})}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          width: '100%',
          position: isActiveWeb ? 'absolute' : 'relative',
          zIndex: isActiveWeb ? 100 : 0,
          opacity: isActiveWeb ? 0.3 : 1,
          cursor: 'grab',
          userSelect: 'none',
          touchAction: 'none',
        } as any}
      >
        {children}
      </View>
    </View>
  );
};

export const DraggableItem: React.FC<DraggableItemProps> = props => {
  return Platform.OS === 'web' ? <WebDraggableItem {...props} /> : <NativeDraggableItem {...props} />;
};
