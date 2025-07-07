import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useCallback,
  useImperativeHandle,
} from 'react';
import {
  View,
  Alert,
  Text,
  TouchableOpacity,
  Pressable,
  Platform,
  FlatList,
} from 'react-native';
import {Formik, FieldArray} from 'formik';
import * as Yup from 'yup';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import Card from 'shared/components/Card';
import SelectableField from 'shared/components/SelectableField';
import ToastContainer from 'shared/components/ToastContainer';
import ModalWrapper from 'shared/components/ModalWrapper';
import {GET_WORKOUT_PLAN_META} from '../graphql/workoutMeta.graphql';
import {useQuery, useMutation} from '@apollo/client';
import {
  CREATE_WORKOUT_PLAN,
  UPDATE_WORKOUT_PLAN,
} from '../graphql/workoutReferences';
import {GET_EXERCISES_BASIC} from '../graphql/workoutMeta.graphql';
import {spacing} from 'shared/theme/tokens';
import {useTheme} from 'shared/theme/ThemeProvider';
import FontAwesome from '@expo/vector-icons/FontAwesome5';
import {useNavigate} from 'react-router-native';
import {useLocation} from 'react-router-native';
import type {PointerEvent} from 'react-native';

// IMPORTS FOR THE CUSTOM DRAG-AND-DROP
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  ScrollView,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  scrollTo,
  useAnimatedScrollHandler,
  useWorkletCallback,
  LinearTransition,
} from 'react-native-reanimated';

// MODULAR MODAL IMPORTS
import SelectExerciseModal from '../components/SelectExerciseModal';
import TrainingGoalPickerModal from '../components/TrainingGoalPickerModal';
import DifficultyPickerModal from '../components/DifficultyPickerModal';
import MuscleGroupPickerModal from '../components/MuscleGroupPickerModal';
import TrainingMethodPicker from '../components/TrainingMethodPicker';
import {useMetricRegistry} from 'shared/context/MetricRegistry';
import TargetMetricInputGroup from 'shared/components/TargetMetricInputGroup';
import {useWorkoutPlanSummary} from 'shared/hooks/WorkoutPlanSummary';
import ExerciseGroupCard from 'shared/components/ExerciseGroupCard';

// TYPE DEFINITIONS
type ActiveModal =
  | null
  | 'trainingGoalPicker'
  | 'difficultyPicker'
  | 'muscleGroupPicker'
  | 'selectExercise'
  | 'trainingMethodPicker'
  | 'groupMethodPicker';

export type ExerciseFormEntry = {
  instanceId: string;
  exerciseId: number;
  exerciseName: string;
  targetSets: number;
  targetMetrics: {
    metricId: number;
    min: number | string;
    max?: number | string;
  }[];
  isWarmup: boolean;
  trainingMethodId?: number | null;
  groupId?: number | null;
  order: number; // 👈 add this
};

export type ExerciseGroup = {
  id: number;
  trainingMethodId: number;
  order: number;
};

type DragData = {type: 'exercise' | 'group'; id: string};

type DraggableItemProps = {
  item: DragData;
  children: React.ReactNode;
  onDrop: (x: number, y: number, data: DragData) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragMove?: (x: number, y: number, data: DragData) => void;
  isDraggingShared: Animated.SharedValue<boolean>;
  pointerPositionY: Animated.SharedValue<number>;
  simultaneousHandlers?: any;
  resetPreviewOffsets?: () => void;
  /**
   * Current scroll offset of the parent ScrollView. This is used so that when
   * the list auto-scrolls during a drag operation, the dragged item stays under
   * the user's finger instead of drifting with the scroll.
   */
  scrollOffset?: Animated.SharedValue<number>;
};

type FormValues = {
  name: string;
  trainingGoalId: number;
  intensityPresetId: number;
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  muscleGroupIds: number[];
  exercises: ExerciseFormEntry[];
  groups: ExerciseGroup[];
};

type MuscleGroupMeta = {
  id: number;
  name: string;
  bodyParts: {
    id: number;
    name: string;
  }[];
};

type RenderItem =
  | {type: 'group'; group: ExerciseGroup}
  | {type: 'exercise'; exercise: ExerciseFormEntry};

type PlanItem =
  | {type: 'exercise'; data: ExerciseFormEntry}
  | {type: 'group'; data: ExerciseGroup};

function getPlanItemsFromForm(values: FormValues): PlanItem[] {
  const items: PlanItem[] = [];
  for (const group of values.groups) {
    items.push({type: 'group', data: group});
  }
  for (const ex of values.exercises.filter(e => e.groupId == null)) {
    items.push({type: 'exercise', data: ex});
  }
  return items.sort((a, b) => a.data.order - b.data.order);
}

type Layout = {
  x: number;
  y: number;
  width: number;
  height: number;
};
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Plan name is required'),
  trainingGoalId: Yup.number().required('Training goal is required'),
  muscleGroupIds: Yup.array().of(Yup.number()),
  exercises: Yup.array()
    .of(
      Yup.object().shape({
        targetSets: Yup.number().min(1).required('Sets required'),
        targetMetrics: Yup.array()
          .of(
            Yup.object().shape({
              metricId: Yup.number().required(),
              min: Yup.mixed().required('Required'),
              max: Yup.mixed().notRequired(),
            }),
          )
          .min(1, 'At least one target metric required'),
      }),
    )
    .min(1, 'Add at least one exercise'),
});

// --- DRAGGABLE ITEM COMPONENTS ---
const NativeDraggableItem: React.FC<DraggableItemProps> = ({
  item,
  children,
  onDrop,
  onDragStart,
  onDragEnd,
  onDragMove,
  isDraggingShared,
  pointerPositionY,
  simultaneousHandlers,
  scrollOffset,
  resetPreviewOffsets,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startScrollY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const [layoutSize, setLayoutSize] = useState<{width: number; height: number}>(
    {
      width: 0,
      height: 0,
    },
  );

  const handleTouchStart = () => {
    onDragStart?.();
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
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
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
      runOnJS(handleTouchEnd)();
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    const scrollDiff = isDragging.value
      ? (scrollOffset?.value ?? 0) - startScrollY.value
      : 0;
    return {
      position: isDragging.value ? 'absolute' : 'relative',
      zIndex: isDragging.value ? 100 : 0,
      opacity: isDragging.value ? 0.7 : 1,
      transform: [
        {translateX: translateX.value},
        {translateY: translateY.value + scrollDiff},
      ],
      elevation: isDragging.value ? 10 : 0,
      shadowRadius: isDragging.value ? 15 : 1,
      shadowOpacity: isDragging.value ? 0.7 : 0,
      shadowOffset: {width: 0, height: isDragging.value ? 10 : 1},
      // DEBUG
      borderWidth: 1,
      borderColor: 'red',
    };
  });

  return (
    <View
      style={{
        width: '100%',
        height: layoutSize.height > 0 ? layoutSize.height : undefined,
      }}>
      <PanGestureHandler
        onGestureEvent={gestureHandler}
        simultaneousHandlers={simultaneousHandlers}>
        <Animated.View
          onLayout={e =>
            setLayoutSize({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            })
          }
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={[animatedStyle, {width: '100%'}]}>
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
  pointerPositionY,
  simultaneousHandlers: _simultaneousHandlers,
  scrollOffset,
}) => {
  const [layoutSize, setLayoutSize] = useState<{width: number; height: number}>(
    {
      width: 0,
      height: 0,
    },
  );
  const [isDragging, setIsDragging] = useState(false);
  const translate = useRef({x: 0, y: 0});
  const start = useRef({x: 0, y: 0});
  const startScrollY = useRef(0);
  const hasMoved = useRef(false);
  const dragThreshold = 5;

  const handlePointerDown = (e: PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const evt = e as unknown as {
      clientX: number;
      clientY: number;
      pointerId: number;
      currentTarget: any;
    };
    setIsDragging(true);
    isDraggingShared.value = true;
    start.current = {
      x: evt.clientX - translate.current.x,
      y: evt.clientY - translate.current.y,
    };
    startScrollY.current = scrollOffset?.value ?? 0;
    hasMoved.current = false;
    onDragStart?.();
    evt.currentTarget.setPointerCapture(evt.pointerId);
  };

  const handlePointerMove = (e: PointerEvent) => {
    e.stopPropagation();
    const evt = e as unknown as {
      clientX: number;
      clientY: number;
      currentTarget: any;
    };
    if (!isDragging) return;
    const dx = evt.clientX - start.current.x;
    const dy = evt.clientY - start.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (!hasMoved.current && distance > dragThreshold) {
      hasMoved.current = true;
    }
    if (!hasMoved.current) return;
    translate.current = {x: dx, y: dy};
    const scrollDiff = (scrollOffset?.value ?? 0) - startScrollY.current;
    evt.currentTarget.style.transform = `translate(${dx}px, ${dy + scrollDiff}px)`;
    pointerPositionY.value = evt.clientY;
    onDragMove?.(evt.clientX, evt.clientY, item);
  };

  const endDrag = (e: PointerEvent) => {
    e.stopPropagation();
    const evt = e as unknown as {
      clientX: number;
      clientY: number;
      pointerId: number;
      currentTarget: any;
    };
    if (!isDragging) return;
    evt.currentTarget.releasePointerCapture(evt.pointerId);
    setIsDragging(false);
    isDraggingShared.value = false;
    translate.current = {x: 0, y: 0};
    evt.currentTarget.style.transform = 'translate(0px, 0px)';
    if (hasMoved.current) {
      onDrop(evt.clientX, evt.clientY, item);
    }
    hasMoved.current = false;
    onDragEnd?.();
  };

  return (
    <View
      style={{
        width: '100%',
        height: layoutSize.height > 0 ? layoutSize.height : undefined,
      }}>
      <View
        onLayout={e =>
          setLayoutSize({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={
          {
            width: '100%',
            position: isDragging ? 'absolute' : 'relative',
            zIndex: isDragging ? 100 : 0,
            opacity: isDragging ? 0.3 : 1,
            cursor: 'grab',
            userSelect: 'none',
            touchAction: 'none',
          } as any
        }>
        {children}
      </View>
    </View>
  );
};

const DraggableItem: React.FC<DraggableItemProps> = props => {
  return Platform.OS === 'web' ? (
    <WebDraggableItem {...props} />
  ) : (
    <NativeDraggableItem {...props} />
  );
};

function DraggableRow({
  children,
  index,
  onDragEnd,
}: {
  children: React.ReactNode;
  index: number;
  onDragEnd: (from: number, to: number) => void;
}) {
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      isDragging.value = true;
    })
    .onUpdate(event => {
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      const itemHeight = 80; // Approximate height
      const newIndex = Math.round(translateY.value / itemHeight) + index;
      const clampedIndex = Math.max(0, newIndex);

      if (clampedIndex !== index) {
        runOnJS(onDragEnd)(index, clampedIndex);
      }

      translateY.value = 0; // Reset position
      isDragging.value = false;
    });

  const style = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
    zIndex: isDragging.value ? 100 : 0,
    elevation: isDragging.value ? 10 : 0,
    shadowOpacity: isDragging.value ? 0.2 : 0,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={style} layout={LinearTransition.duration(200)}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const HEADER_HEIGHT_OFFSET = 61;
const SCROLL_THRESHOLD = 80; // Pixels from screen edges to start scrolling
const SCROLL_SPEED = 10; // Pixels per frame scroll speed

export default function WorkoutPlanBuilderScreen() {
  const {theme} = useTheme();
  const navigate = useNavigate();
  const {data: workoutMeta, refetch} = useQuery(GET_WORKOUT_PLAN_META);
  const [createWorkoutPlan] = useMutation(CREATE_WORKOUT_PLAN);
  const [updateWorkoutPlan] = useMutation(UPDATE_WORKOUT_PLAN);
  const {createPlanningTargetMetrics} = useMetricRegistry();
  const {data: exerciseData} = useQuery(GET_EXERCISES_BASIC);

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<
    number | null
  >(null);
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState<
    number | null
  >(null);
  const [stagedGroupId, setStagedGroupId] = useState<number | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [scrollLayoutVersion, setScrollLayoutVersion] = useState(0);
  // Track which group the user is hovering over during a drag. Using a shared
  // value avoids React re-renders that can interrupt the gesture.
  const hoveredGroupId = useSharedValue<number | null>(null);
  const [scrollViewReady, setScrollViewReady] = useState(false);

  const groupLayouts = useRef<Record<number, Layout>>({});
  const exerciseLayouts = useRef<Record<string, Layout>>({});
  const dragOffsets = useRef<Record<string, Animated.SharedValue<number>>>({});
  const exerciseRefs = useRef<Map<string, {measure: () => void} | null>>(
    new Map(),
  );
  const groupRefs = useRef<Map<string, {measure: () => void} | null>>(
    new Map(),
  );

  const resetPreviewOffsets = () => {
    for (const key in dragOffsets.current) {
      dragOffsets.current[key].value = 0;
    }
  };

  const scrollOffsetY = useSharedValue(0);
  const scrollRef = useAnimatedRef<ScrollView>();
  const isDraggingItem = useRef(false);
  const scrollViewHeight = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const pointerPositionY = useSharedValue(0);

  const reMeasureAllItems = useCallback(() => {
    exerciseRefs.current.forEach(ref => ref?.measure());
    groupRefs.current.forEach(ref => ref?.measure());
  }, []);

  const handleDragStart = () => {
    reMeasureAllItems();
    isDraggingItem.current = true;
    if (Platform.OS !== 'web') {
      scrollRef.current?.setNativeProps({scrollEnabled: false});
    }
    resetPreviewOffsets();
  };

  const handleDragEnd = () => {
    isDraggingItem.current = false;
    if (Platform.OS !== 'web') {
      scrollRef.current?.setNativeProps({scrollEnabled: true});
    }
    resetPreviewOffsets();
    hoveredGroupId.value = null;

    setScrollLayoutVersion(prev => prev + 1);
  };

  useAnimatedReaction(
    () => ({
      dragging: isDragging.value,
      pointerY: pointerPositionY.value,
    }),
    ({dragging, pointerY}) => {
      if (!dragging) {
        return;
      }

      const topBoundary = HEADER_HEIGHT_OFFSET + SCROLL_THRESHOLD;
      const bottomBoundary =
        HEADER_HEIGHT_OFFSET + scrollViewHeight.value - SCROLL_THRESHOLD;

      let newOffset = scrollOffsetY.value;

      if (pointerY < topBoundary) {
        newOffset = Math.max(scrollOffsetY.value - SCROLL_SPEED, 0);
      } else if (pointerY > bottomBoundary) {
        const maxOffset = contentHeight.value - scrollViewHeight.value;
        newOffset = Math.min(scrollOffsetY.value + SCROLL_SPEED, maxOffset);
      }

      if (newOffset !== scrollOffsetY.value) {
        scrollOffsetY.value = newOffset;
        scrollTo(scrollRef, 0, newOffset, false);
      }
    },
    [scrollOffsetY, scrollViewHeight, contentHeight, scrollRef],
  );

  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollOffsetY.value = event.contentOffset.y;
  });

  useAnimatedReaction(
    () => scrollOffsetY.value,
    () => {
      runOnJS(reMeasureAllItems)();
    },
    [],
  );

  type MeasuredExerciseItemProps = {
    item: ExerciseFormEntry;
    onDrop: (x: number, y: number, data: DragData) => void;
    children: React.ReactNode;
    simultaneousHandlers?: any;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    onDragMove?: (x: number, y: number, data: DragData) => void;
    layoutVersion: number;
    scrollLayoutVersion: number;
    hoverVersion?: number;
  };

  const MeasuredExerciseItemComponent = React.forwardRef<
    {measure: () => void},
    MeasuredExerciseItemProps
  >(
    (
      {
        item,
        onDrop,
        children,
        simultaneousHandlers,
        onDragStart,
        onDragEnd,
        onDragMove,
        layoutVersion,
        scrollLayoutVersion,
      },
      refProp,
    ) => {
      const innerRef = useRef<View>(null);
      const offset = useSharedValue(0);

      useEffect(() => {
        dragOffsets.current[item.instanceId] = offset;
        return () => {
          delete dragOffsets.current[item.instanceId];
          delete exerciseLayouts.current[item.instanceId];
        };
      }, [item.instanceId]);

      const measure = () => {
        innerRef.current?.measure((x, y, width, height, pageX, pageY) => {
          if (width > 0 && height > 0) {
            exerciseLayouts.current[item.instanceId] = {
              x: pageX,
              y: pageY,
              width,
              height,
            };
            offset.value = 0;
          }
        });
      };

      useImperativeHandle(refProp, () => ({measure}));

      useEffect(() => {
        measure();
      }, [item.instanceId, item.order, layoutVersion, scrollLayoutVersion]);

      const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: [{translateY: offset.value}],
      }));

      return (
        <Animated.View
          ref={innerRef}
          onLayout={measure}
          style={animatedContainerStyle}
          collapsable={false} // ADD THIS PROP
        >
          <DraggableItem
            item={{type: 'exercise', id: item.instanceId}}
            onDrop={onDrop}
            simultaneousHandlers={simultaneousHandlers}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragMove={onDragMove}
            isDraggingShared={isDragging}
            pointerPositionY={pointerPositionY}
            scrollOffset={scrollOffsetY}>
            {children}
          </DraggableItem>
        </Animated.View>
      );
    },
  );

  const MeasuredExerciseItem = React.memo(MeasuredExerciseItemComponent);

  type MeasuredGroupItemProps = {
    group: ExerciseGroup;
    onDrop: (x: number, y: number, data: DragData) => void;
    children: React.ReactNode;
    simultaneousHandlers?: any;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    onDragMove?: (x: number, y: number, data: DragData) => void;
    layoutVersion: number;
    scrollLayoutVersion: number;
    hoverVersion?: number;
  };

  const MeasuredGroupItem = React.forwardRef<
    {measure: () => void},
    MeasuredGroupItemProps
  >(
    (
      {
        group,
        onDrop,
        children,
        simultaneousHandlers,
        onDragStart,
        onDragEnd,
        onDragMove,
        layoutVersion,
        scrollLayoutVersion,
      },
      refProp,
    ) => {
      const innerRef = useRef<View>(null);
      const offset = useSharedValue(0);

      useEffect(() => {
        dragOffsets.current[String(group.id)] = offset;
        return () => {
          delete dragOffsets.current[String(group.id)];
          delete groupLayouts.current[group.id];
        };
      }, [group.id]);

      const measure = () => {
        innerRef.current?.measure((x, y, width, height, pageX, pageY) => {
          if (width > 0 && height > 0) {
            groupLayouts.current[group.id] = {
              x: pageX,
              y: pageY,
              width,
              height,
            };
            offset.value = 0;
          }
        });
      };

      useImperativeHandle(refProp, () => ({measure}));

      useEffect(() => {
        measure();
      }, [group.id, group.order, layoutVersion, scrollLayoutVersion]);

      const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: [{translateY: offset.value}],
      }));

      return (
        <Animated.View
          ref={innerRef}
          onLayout={measure}
          style={animatedContainerStyle}
          collapsable={false}>
          <DraggableItem
            item={{type: 'group', id: String(group.id)}}
            onDrop={onDrop}
            simultaneousHandlers={simultaneousHandlers}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragMove={onDragMove}
            isDraggingShared={isDragging}
            pointerPositionY={pointerPositionY}
            scrollOffset={scrollOffsetY}>
            {children}
          </DraggableItem>
        </Animated.View>
      );
    },
  );

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };
  const groupIdCounterRef = useRef(1);

  const getNextGlobalOrder = (
    exs: ExerciseFormEntry[],
    grps: ExerciseGroup[],
  ): number => {
    const orders = [
      ...exs.map(e => e.order ?? 0),
      ...grps.map(g => g.order ?? 0),
    ];
    return orders.length > 0 ? Math.max(...orders) + 1 : 0;
  };

  const reindexAllOrders = (
    exs: ExerciseFormEntry[],
    grps: ExerciseGroup[],
  ): {exercises: ExerciseFormEntry[]; groups: ExerciseGroup[]} => {
    const items: PlanItem[] = [
      ...grps.map(g => ({type: 'group' as const, data: g})),
      ...exs.map(e => ({type: 'exercise' as const, data: e})),
    ];
    items.sort((a, b) => a.data.order - b.data.order);

    const newExercises = [...exs];
    const newGroups = [...grps];

    items.forEach((it, idx) => {
      if (it.type === 'exercise') {
        const exIdx = newExercises.findIndex(
          e => e.instanceId === it.data.instanceId,
        );
        if (exIdx !== -1) newExercises[exIdx].order = idx;
      } else {
        const gIdx = newGroups.findIndex(g => g.id === it.data.id);
        if (gIdx !== -1) newGroups[gIdx].order = idx;
      }
    });

    return {exercises: newExercises, groups: newGroups};
  };

  const confirmAsync = (title: string, message: string) =>
    new Promise<boolean>(resolve => {
      Alert.alert(title, message, [
        {text: 'Cancel', style: 'cancel', onPress: () => resolve(false)},
        {text: 'Continue', onPress: () => resolve(true)},
      ]);
    });

  // Placeholder shown when dragging an exercise over a group. Uses an animated
  // style so visibility changes do not require React re-renders.
  const GroupDropPlaceholder: React.FC<{
    groupId: number;
    hoveredGroupId: Animated.SharedValue<number | null>;
  }> = ({groupId, hoveredGroupId}) => {
    const animatedStyle = useAnimatedStyle(() => {
      const visible = hoveredGroupId.value === groupId;
      return {
        height: visible ? 48 : 0,
        opacity: visible ? 1 : 0,
        margin: visible ? spacing.sm : 0,
      };
    });

    return (
      <Animated.View
        style={[
          {
            backgroundColor: '#D7FCB5',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 6,
          },
          animatedStyle,
        ]}>
        <Text>Drop here to add to group</Text>
      </Animated.View>
    );
  };

  const renderedExerciseIds = useRef<Set<string>>(new Set());

  function convertPlanToInitialValues(plan: any): FormValues {
    const isFromSession = plan.isFromSession;
    function deriveGroupsFromExercises(
      exercises: ExerciseFormEntry[],
    ): ExerciseGroup[] {
      const seen = new Map<string, ExerciseGroup>();
      for (const ex of exercises) {
        if (ex.groupId != null && ex.trainingMethodId != null) {
          const key = `${ex.groupId}-${ex.trainingMethodId}`;
          if (!seen.has(key)) {
            seen.set(key, {
              id: ex.groupId,
              trainingMethodId: ex.trainingMethodId,
              order: 0,
            });
          }
        }
      }
      return Array.from(seen.values()).map((g, idx) => ({...g, order: idx}));
    }

    if (isFromSession) {
      const exercises = plan.exercises.map((ex: any, idx: number) => ({
        instanceId: ex.instanceId || generateUniqueId(),
        exerciseId: ex.exerciseId ?? ex.exercise.id,
        exerciseName: ex.exerciseName ?? ex.exercise.name,
        targetSets: ex.targetSets,
        targetMetrics: ex.targetMetrics?.length
          ? ex.targetMetrics
          : createPlanningTargetMetrics(ex.exerciseId ?? ex.exercise.id),
        trainingMethodId: ex.trainingMethodId ?? ex.trainingMethod?.id ?? null,
        groupId: ex.groupId ?? null,
        isWarmup: ex.isWarmup ?? false,
        order: ex.order ?? idx,
      }));

      return {
        name: plan.name,
        trainingGoalId: plan.trainingGoal?.id,
        intensityPresetId: plan.intensityPreset?.id ?? undefined,
        experienceLevel: plan.intensityPreset?.experienceLevel ?? undefined,
        muscleGroupIds: [],
        exercises,
        groups:
          plan.groups?.map((g: any) => ({
            id: g.id,
            trainingMethodId: g.trainingMethodId,
            order: g.order,
          })) ?? deriveGroupsFromExercises(exercises),
      };
    }

    const exercises = plan.exercises.map((ex: any, idx: number) => ({
      instanceId: ex.instanceId || generateUniqueId(),
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      targetSets: ex.targetSets,
      targetMetrics:
        ex.targetMetrics ?? createPlanningTargetMetrics(ex.exerciseId),
      trainingMethodId: ex.trainingMethodId ?? null,
      groupId: ex.groupId ?? null,
      isWarmup: ex.isWarmup ?? false,
      order: ex.order ?? idx,
    }));

    return {
      name: plan.name,
      trainingGoalId: plan.trainingGoal?.id,
      intensityPresetId: plan.intensityPreset?.id ?? undefined,
      experienceLevel: plan.intensityPreset?.experienceLevel ?? undefined,
      muscleGroupIds: plan.muscleGroups.map((mg: any) => mg.id),
      exercises,
      groups:
        plan.groups?.map((g: any) => ({
          id: g.id,
          trainingMethodId: g.trainingMethodId,
          order: g.order,
        })) ?? deriveGroupsFromExercises(exercises),
    };
  }
  const location = useLocation();
  const rawPlan = location.state?.initialPlan;
  const formInitialValues = useMemo(() => {
    const plan = rawPlan ? convertPlanToInitialValues(rawPlan) : undefined;
    if (plan && rawPlan.isFromSession && plan.muscleGroupIds.length === 0) {
      const bodyPartIds = rawPlan?.bodyPartIds ?? [];
      const autoDetectedMuscleGroupIds =
        workoutMeta?.getMuscleGroups
          ?.filter((group: MuscleGroupMeta) =>
            group.bodyParts.some((bp: any) => bodyPartIds.includes(bp.id)),
          )
          .map((group: MuscleGroupMeta) => group.id) ?? [];
      plan.muscleGroupIds = autoDetectedMuscleGroupIds;
    }
    return (
      plan ?? {
        name: '',
        trainingGoalId: 0,
        intensityPresetId: 0,
        muscleGroupIds: [],
        exercises: [],
        groups: [],
      }
    );
  }, [rawPlan, workoutMeta?.getMuscleGroups]);

  useEffect(() => {
    const maxId = formInitialValues.groups.reduce(
      (acc, g) => (g.id > acc ? g.id : acc),
      0,
    );
    if (maxId >= groupIdCounterRef.current) {
      groupIdCounterRef.current = maxId + 1;
    }
  }, [formInitialValues]);

  useEffect(() => {
    if (formInitialValues && scrollViewReady) {
      setLayoutVersion(prev => prev + 1);
    }
  }, [formInitialValues, scrollViewReady]);

  const isEdit = !!rawPlan && !rawPlan.isFromSession;
  const pushRef = useRef<(item: any) => void>(() => {});

  function getSelectedBodyPartIds(
    selectedGroupIds: number[],
    allGroups: any[],
  ): number[] {
    const bodyPartSet = new Set<number>();
    for (const group of allGroups) {
      if (selectedGroupIds.includes(group.id)) {
        for (const bp of group.bodyParts || []) {
          bodyPartSet.add(bp.id);
        }
      }
    }
    return Array.from(bodyPartSet);
  }

  function filterExercisesByBodyParts(
    exercises: any[],
    selectedBodyPartIds: number[],
  ) {
    const idSet = new Set(selectedBodyPartIds);
    return exercises.filter(ex =>
      ex.primaryMuscles?.some(
        (m: any) => m.bodyPart && idSet.has(m.bodyPart.id),
      ),
    );
  }

  return (
    <ScreenLayout>
      <Formik<FormValues>
        // enableReinitialize
        initialValues={formInitialValues}
        validationSchema={validationSchema}
        onSubmit={async values => {
          const methodById = new Map<number, any>(
            (workoutMeta?.getTrainingMethods ?? []).map((m: any) => [m.id, m]),
          );

          const invalidGroups = values.groups.filter(g => {
            const method = methodById.get(g.trainingMethodId);
            if (!method) return false;
            const exercisesInGroup = values.exercises.filter(
              ex => ex.groupId === g.id,
            );
            const min = method.minGroupSize ?? 1;
            return exercisesInGroup.length > 0 && exercisesInGroup.length < min;
          });

          if (invalidGroups.length > 0) {
            const proceed = await confirmAsync(
              'Group Too Small',
              'Some groups have fewer exercises than required. Continue and ungroup them?',
            );
            if (!proceed) {
              return;
            }
            const invalidIds = new Set(invalidGroups.map(g => g.id));
            values.exercises = values.exercises.map(ex =>
              ex.groupId != null && invalidIds.has(ex.groupId)
                ? {...ex, groupId: null, trainingMethodId: null}
                : ex,
            );
            values.groups = values.groups.filter(g => !invalidIds.has(g.id));
          }

          const validGroupIds = new Set<number>();

          values.groups.forEach(group => {
            const method = methodById.get(group.trainingMethodId);
            if (!method) return;

            const groupExercises = values.exercises.filter(
              ex => ex.groupId === group.id,
            );

            const min = method.minGroupSize ?? 1;
            if (groupExercises.length >= min) {
              validGroupIds.add(group.id);
            }
          });
          const matchedPreset = workoutMeta?.getIntensityPresets?.find(
            (p: any) =>
              p.trainingGoalId === values.trainingGoalId &&
              p.experienceLevel === values.experienceLevel,
          );
          const transformedInput = {
            name: values.name,
            trainingGoalId: values.trainingGoalId,
            intensityPresetId: matchedPreset?.id ?? null,
            muscleGroupIds: values.muscleGroupIds,
            groups: [...values.groups]
              .sort((a, b) => a.order - b.order)
              .map(g => ({
                id: g.id,
                trainingMethodId: g.trainingMethodId,
                order: g.order,
              })),
            exercises: [...values.exercises]
              .sort((a, b) => a.order - b.order)
              .map(ex => ({
                exerciseId: ex.exerciseId,
                order: ex.order, // ✅ Preserve existing order
                targetSets: ex.targetSets,
                targetMetrics: ex.targetMetrics.map(m => ({
                  metricId: m.metricId,
                  min: typeof m.min === 'string' ? parseFloat(m.min) : m.min,
                  max:
                    m.max != null && m.max !== ''
                      ? typeof m.max === 'string'
                        ? parseFloat(m.max)
                        : m.max
                      : null,
                })),
                isWarmup: ex.isWarmup ?? false,
                groupId: ex.groupId ?? null,
                trainingMethodId: ex.trainingMethodId ?? null,
              })),
          };

          try {
            const result = isEdit
              ? await updateWorkoutPlan({
                  variables: {id: rawPlan.id, input: transformedInput},
                })
              : await createWorkoutPlan({variables: {input: transformedInput}});

            Alert.alert(
              `Workout Plan ${isEdit ? 'Updated' : 'Created'}!`,
              `Plan successfully ${isEdit ? 'updated' : 'created'}.`,
            );
            navigate('/user/my-plans');
          } catch (error) {
            console.error('❌ Error submitting workout plan:', error);
            Alert.alert('Error', 'Failed to save the plan. Check the console.');
          }
        }}>
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          setFieldValue,
        }) => {
          const valuesRef = useRef<FormValues>(values);
          useEffect(() => {
            valuesRef.current = values;
          });

          const selectedBodyPartIds = getSelectedBodyPartIds(
            values.muscleGroupIds,
            workoutMeta?.getMuscleGroups ?? [],
          );
          const filteredExercises = filterExercisesByBodyParts(
            exerciseData?.getExercises ?? [],
            selectedBodyPartIds,
          );
          const renderSummary = useWorkoutPlanSummary();
          const getMethodById = (id: number) =>
            workoutMeta?.getTrainingMethods?.find((m: any) => m.id === id);

          const getGroupLabel = (group: ExerciseGroup) => {
            const method = getMethodById(group.trainingMethodId);
            if (!method) return 'Unnamed Group';
            const range =
              method.minGroupSize === method.maxGroupSize
                ? `${method.minGroupSize}`
                : `${method.minGroupSize ?? 1}–${method.maxGroupSize ?? '∞'}`;
            return `${method.name} (${range})`;
          };

          const getGroupLabelById = (groupId: number) => {
            const group = values.groups.find(g => g.id === groupId);
            return group ? getGroupLabel(group) : 'None';
          };

          const planItems = getPlanItemsFromForm(values);

          const getGroupedExercises = (groupId: number) => {
            return values.exercises
              .filter(ex => ex.groupId === groupId)
              .sort((a, b) => a.order - b.order);
          };

          const renderedExercises = planItems.flatMap(item =>
            item.type === 'exercise'
              ? [item.data]
              : getGroupedExercises(item.data.id),
          );

          const getUngroupedExercises = () => {
            return values.exercises
              .filter(ex => ex.groupId == null)
              .sort((a, b) => a.order - b.order);
          };

          const isPointInLayout = (
            pointX: number,
            pointY: number,
            layout: Layout,
          ) => {
            return (
              pointX >= layout.x &&
              pointX <= layout.x + layout.width &&
              pointY >= layout.y &&
              pointY <= layout.y + layout.height
            );
          };

          const updatePreviewOffsets = useCallback(
            (x: number, y: number, draggedItemData: DragData) => {
              if (draggedItemData.type === 'exercise') {
                let foundHover = false;
                for (const groupIdStr in groupLayouts.current) {
                  const groupLayout = groupLayouts.current[groupIdStr];
                  if (isPointInLayout(x, y, groupLayout)) {
                    if (hoveredGroupId.value !== Number(groupIdStr)) {
                      hoveredGroupId.value = Number(groupIdStr);
                    }
                    foundHover = true;
                    break;
                  }
                }
                if (!foundHover && hoveredGroupId.value !== null) {
                  hoveredGroupId.value = null;
                }
                if (foundHover) {
                  return;
                }
              }

              const draggedKey =
                draggedItemData.type === 'group'
                  ? String(draggedItemData.id)
                  : draggedItemData.id;

              const containerItems: {id: string; layout: Layout}[] = [];

              // Identify relevant items
              if (
                draggedItemData.type === 'group' ||
                (draggedItemData.type === 'exercise' &&
                  valuesRef.current.exercises.find(
                    e => e.instanceId === draggedItemData.id,
                  )?.groupId === null)
              ) {
                for (const id in exerciseLayouts.current) {
                  const ex = valuesRef.current.exercises.find(
                    e => e.instanceId === id,
                  );
                  if (ex && ex.groupId == null && exerciseLayouts.current[id]) {
                    containerItems.push({
                      id,
                      layout: exerciseLayouts.current[id],
                    });
                  }
                }
                for (const id in groupLayouts.current) {
                  const groupFound = valuesRef.current.groups.find(
                    g => String(g.id) === id,
                  );
                  if (groupFound && groupLayouts.current[id]) {
                    containerItems.push({
                      id: String(id),
                      layout: groupLayouts.current[id],
                    });
                  }
                }
                containerItems.sort((a, b) => a.layout.y - b.layout.y);
              } else {
                const draggedEx = valuesRef.current.exercises.find(
                  ex => ex.instanceId === draggedItemData.id,
                );
                if (!draggedEx) return;
                const exs = valuesRef.current.exercises
                  .filter(ex => ex.groupId === draggedEx.groupId)
                  .sort((a, b) => a.order - b.order);
                exs.forEach(ex => {
                  const layout = exerciseLayouts.current[ex.instanceId];
                  if (layout) containerItems.push({id: ex.instanceId, layout});
                });
              }

              const fromIdx = containerItems.findIndex(
                it => it.id === draggedKey,
              );
              if (fromIdx === -1) return;

              let toIdx = fromIdx;

              for (let i = 0; i < containerItems.length; i++) {
                if (containerItems[i].id === draggedKey) continue;
                const layout = containerItems[i].layout;
                if (y < layout.y + layout.height / 2) {
                  toIdx = i;
                  break;
                }
                if (i === containerItems.length - 1)
                  toIdx = containerItems.length - 1;
              }

              // Reset offsets immediately (no animation)
              containerItems.forEach(item => {
                if (dragOffsets.current[item.id]) {
                  dragOffsets.current[item.id].value = 0;
                }
              });

              const draggedItemHeight = containerItems[fromIdx].layout.height;

              // Immediate position shifting without spring animation
              if (toIdx > fromIdx) {
                for (let i = fromIdx + 1; i <= toIdx; i++) {
                  const key = containerItems[i].id;
                  if (dragOffsets.current[key]) {
                    dragOffsets.current[key].value = -draggedItemHeight;
                  }
                }
              } else if (toIdx < fromIdx) {
                for (let i = toIdx; i < fromIdx; i++) {
                  const key = containerItems[i].id;
                  if (dragOffsets.current[key]) {
                    dragOffsets.current[key].value = draggedItemHeight;
                  }
                }
              }
            },
            [],
          );

          const handleDragMove = useWorkletCallback(
            (x: number, y: number, data: DragData) => {
              runOnJS(updatePreviewOffsets)(x, y, data);
            },
            [],
          );

          const handleDrop = useCallback(
            (x: number, y: number, draggedItemData: DragData) => {
              if (draggedItemData.type === 'group') {
                const allTopLevelItems: {
                  id: string;
                  type: 'exercise' | 'group';
                  layout: Layout;
                }[] = [];

                for (const id in exerciseLayouts.current) {
                  const ex = values.exercises.find(e => e.instanceId === id);
                  if (ex && ex.groupId == null) {
                    allTopLevelItems.push({
                      id,
                      type: 'exercise',
                      layout: exerciseLayouts.current[id],
                    });
                  }
                }
                for (const id in groupLayouts.current) {
                  allTopLevelItems.push({
                    id: String(id),
                    type: 'group',
                    layout: groupLayouts.current[id],
                  });
                }

                allTopLevelItems.sort((a, b) => a.layout.y - b.layout.y);

                for (const target of allTopLevelItems) {
                  if (target.id === draggedItemData.id) continue;
                  if (isPointInLayout(x, y, target.layout)) {
                    reorderPlanItems(
                      draggedItemData,
                      {type: target.type, id: target.id},
                      values,
                      setFieldValue,
                    );
                    return;
                  }
                }
                return;
              }

              const draggedItem = values.exercises.find(
                ex => ex.instanceId === draggedItemData.id,
              );
              if (!draggedItem) return;

              for (const targetId in exerciseLayouts.current) {
                if (targetId === draggedItemData.id) continue;
                const layout = exerciseLayouts.current[targetId];
                if (isPointInLayout(x, y, layout)) {
                  const target = values.exercises.find(
                    ex => ex.instanceId === targetId,
                  );
                  if (target && target.groupId === draggedItem.groupId) {
                    reorderExercises(
                      draggedItemData.id,
                      targetId,
                      values.exercises,
                      setFieldValue,
                    );
                    return;
                  }
                }
              }

              for (const groupIdStr in groupLayouts.current) {
                const layout = groupLayouts.current[groupIdStr];
                if (isPointInLayout(x, y, layout)) {
                  const targetGroupId = parseInt(groupIdStr, 10);
                  if (draggedItem.groupId !== targetGroupId) {
                    const group = values.groups.find(
                      g => g.id === targetGroupId,
                    );
                    const method = group
                      ? getMethodById(group.trainingMethodId)
                      : null;
                    const max = method?.maxGroupSize;
                    const currentCount = values.exercises.filter(
                      e => e.groupId === targetGroupId,
                    ).length;
                    if (max != null && currentCount >= max) {
                      Alert.alert(
                        'Group Limit Reached',
                        `You can only add ${max} exercises to this group.`,
                      );
                      if (hoveredGroupId.value !== null) {
                        hoveredGroupId.value = null;
                      }
                      return;
                    }
                    updateExerciseGroup(
                      draggedItemData.id,
                      targetGroupId,
                      values.exercises,
                      values.groups,
                      setFieldValue,
                    );
                  }
                  return;
                }
              }

              if (draggedItem.groupId == null) {
                const allTopLevelItems: {
                  id: string;
                  type: 'exercise' | 'group';
                  layout: Layout;
                }[] = [];

                for (const id in exerciseLayouts.current) {
                  const ex = values.exercises.find(e => e.instanceId === id);
                  if (ex && ex.groupId == null) {
                    allTopLevelItems.push({
                      id,
                      type: 'exercise',
                      layout: exerciseLayouts.current[id],
                    });
                  }
                }
                for (const id in groupLayouts.current) {
                  allTopLevelItems.push({
                    id: String(id),
                    type: 'group',
                    layout: groupLayouts.current[id],
                  });
                }

                allTopLevelItems.sort((a, b) => a.layout.y - b.layout.y);

                for (const target of allTopLevelItems) {
                  if (target.id === draggedItemData.id) continue;
                  if (isPointInLayout(x, y, target.layout)) {
                    reorderPlanItems(
                      draggedItemData,
                      {type: target.type, id: target.id},
                      values,
                      setFieldValue,
                    );
                    return;
                  }
                }
              }

              if (draggedItem.groupId !== null) {
                updateExerciseGroup(
                  draggedItemData.id,
                  null,
                  values.exercises,
                  values.groups,
                  setFieldValue,
                );
              }
              if (hoveredGroupId.value !== null) {
                hoveredGroupId.value = null;
              }
            },
            [setFieldValue, handleDragEnd],
          );
          const updateExerciseGroup = (
            instanceId: string,
            groupId: number | null,
            currentExercises: ExerciseFormEntry[],
            currentGroups: ExerciseGroup[],
            setFieldValueFn: (field: string, value: any) => void,
          ) => {
            const exerciseIndex = currentExercises.findIndex(
              ex => ex.instanceId === instanceId,
            );
            if (exerciseIndex === -1) return;

            if (groupId !== null) {
              const group = currentGroups.find(g => g.id === groupId);
              const method = group
                ? getMethodById(group.trainingMethodId)
                : null;
              const max = method?.maxGroupSize;
              if (max != null) {
                const currentCount = currentExercises.filter(
                  e => e.groupId === groupId,
                ).length;
                if (currentCount >= max) {
                  Alert.alert(
                    'Group Limit Reached',
                    `You can only add ${max} exercises to this group.`,
                  );
                  return;
                }
              }
            }
            const newTrainingMethodId =
              groupId !== null
                ? (currentGroups.find(g => g.id === groupId)
                    ?.trainingMethodId ?? null)
                : null;
            const updatedGroups = [...currentGroups];
            if (
              groupId !== null &&
              !updatedGroups.find(g => g.id === groupId)
            ) {
              const methodId =
                currentExercises[exerciseIndex]?.trainingMethodId ??
                newTrainingMethodId;
              const nextGroupOrder = getNextGlobalOrder(
                currentExercises,
                updatedGroups,
              );
              updatedGroups.push({
                id: groupId,
                trainingMethodId: methodId ?? 0,
                order: nextGroupOrder,
              });
            }
            const updatedExercises = [...currentExercises];
            if (exerciseIndex === -1) return;

            let provisionalOrder: number;
            if (groupId !== null) {
              const related = updatedExercises.filter(
                e => e.groupId === groupId && e.instanceId !== instanceId,
              );
              const base = [
                ...(updatedGroups.find(g => g.id === groupId)
                  ? [updatedGroups.find(g => g.id === groupId)!.order]
                  : []),
                ...related.map(e => e.order),
              ];
              provisionalOrder = (base.length ? Math.max(...base) : 0) + 0.1;
            } else {
              const ungrouped = updatedExercises.filter(
                e => e.groupId == null && e.instanceId !== instanceId,
              );
              const base = [
                ...ungrouped.map(e => e.order),
                ...updatedGroups.map(g => g.order),
              ];
              provisionalOrder = (base.length ? Math.max(...base) : 0) + 0.1;
            }

            updatedExercises[exerciseIndex] = {
              ...updatedExercises[exerciseIndex],
              groupId,
              trainingMethodId: newTrainingMethodId,
              order: provisionalOrder,
            };

            const {exercises: finalExercises, groups: finalGroups} =
              reindexAllOrders(updatedExercises, updatedGroups);

            setFieldValueFn('groups', finalGroups);
            setFieldValueFn('exercises', finalExercises);
            setLayoutVersion(prev => prev + 1);
          };

          const reorderExercises = (
            draggedId: string,
            targetId: string,
            currentExercises: ExerciseFormEntry[],
            setFieldValueFn: (field: string, value: any) => void,
          ) => {
            const draggedItem = currentExercises.find(
              ex => ex.instanceId === draggedId,
            );
            const targetItem = currentExercises.find(
              ex => ex.instanceId === targetId,
            );
            if (!draggedItem || !targetItem) return;

            if (draggedItem.groupId !== targetItem.groupId) {
              console.warn(
                'Attempted to reorder exercises across different groups.',
              );
              return;
            }

            const containerExercises = currentExercises
              .filter(ex => ex.groupId === draggedItem.groupId)
              .sort((a, b) => a.order - b.order);

            const fromIdx = containerExercises.findIndex(
              ex => ex.instanceId === draggedId,
            );
            const toIdx = containerExercises.findIndex(
              ex => ex.instanceId === targetId,
            );
            if (fromIdx === -1 || toIdx === -1) return;

            const [moved] = containerExercises.splice(fromIdx, 1);
            containerExercises.splice(toIdx, 0, moved);

            const updatedExercises = currentExercises.map(ex => {
              const idx = containerExercises.findIndex(
                ce => ce.instanceId === ex.instanceId,
              );
              if (idx !== -1) {
                return {...ex, order: idx};
              }
              return ex;
            });

            const {exercises: finalExercises, groups: finalGroups} =
              reindexAllOrders(updatedExercises, values.groups);

            setFieldValueFn('exercises', finalExercises);
            setFieldValueFn('groups', finalGroups);
            setLayoutVersion(prev => prev + 1);
          };

          const reorderPlanItems = (
            dragged: DragData,
            target: DragData,
            currentValues: FormValues,
            setFieldValueFn: (field: string, value: any) => void,
          ) => {
            const items = getPlanItemsFromForm(currentValues);
            const draggedIndex = items.findIndex(i => {
              if (i.type !== dragged.type) return false;
              return i.type === 'exercise'
                ? i.data.instanceId === dragged.id
                : String(i.data.id) === dragged.id;
            });
            const targetIndex = items.findIndex(i => {
              if (i.type !== target.type) return false;
              return i.type === 'exercise'
                ? i.data.instanceId === target.id
                : String(i.data.id) === target.id;
            });
            if (draggedIndex === -1 || targetIndex === -1) return;

            const newItems = [...items];
            const [moved] = newItems.splice(draggedIndex, 1);
            newItems.splice(targetIndex, 0, moved);

            const newExercises = [...currentValues.exercises];
            const newGroups = [...currentValues.groups];

            newItems.forEach((it, idx) => {
              if (it.type === 'exercise') {
                const exIdx = newExercises.findIndex(
                  e => e.instanceId === it.data.instanceId,
                );
                if (exIdx !== -1) newExercises[exIdx].order = idx;
              } else {
                const gIdx = newGroups.findIndex(g => g.id === it.data.id);
                if (gIdx !== -1) newGroups[gIdx].order = idx;
              }
            });

            setFieldValueFn('exercises', newExercises);
            setFieldValueFn('groups', newGroups);
            setLayoutVersion(prev => prev + 1);
          };
          const ListHeader = (
            <>
              <Title
                text={isEdit ? 'Edit Workout Plan' : 'Build Workout Plan'}
                subtitle={
                  isEdit
                    ? 'Modify your existing workout session'
                    : 'Create a reusable workout session'
                }
              />
              <Card title="Plan Details">
                <FormInput
                  label="Plan Name"
                  value={values.name}
                  onChangeText={handleChange('name')}
                  onBlur={() => handleBlur('name')}
                  error={touched.name && errors.name ? errors.name : undefined}
                />
                <SelectableField
                  label="Training Goal"
                  value={
                    workoutMeta?.getTrainingGoals?.find(
                      (goal: any) => goal.id === values.trainingGoalId,
                    )?.name || 'Select Training Goal'
                  }
                  onPress={() => setActiveModal('trainingGoalPicker')}
                />
                <SelectableField
                  label="Planned Difficulty"
                  value={
                    values.experienceLevel
                      ? values.experienceLevel.charAt(0) +
                        values.experienceLevel.slice(1).toLowerCase()
                      : 'Select Difficulty'
                  }
                  onPress={() => setActiveModal('difficultyPicker')}
                />
                <SelectableField
                  label="Muscle Groups"
                  value={
                    values.muscleGroupIds.length > 0
                      ? `${values.muscleGroupIds.length} selected`
                      : 'Select Muscle Groups'
                  }
                  onPress={() => setActiveModal('muscleGroupPicker')}
                  disabled={!values.trainingGoalId}
                />
              </Card>
              <View style={{padding: spacing.md}}>
                <Title text="Exercises" />
                <View style={{marginVertical: spacing.sm}}>
                  <Button
                    text="Create Exercise Group"
                    onPress={() => {
                      setStagedGroupId(groupIdCounterRef.current++);
                      setActiveModal('groupMethodPicker');
                    }}
                  />
                </View>
                <Button
                  text={reorderMode ? 'Done Reordering' : 'Edit Order'}
                  disabled={values.exercises.length < 1}
                  onPress={() => setReorderMode(prev => !prev)}
                />
              </View>
            </>
          );

          const ListFooter = (
            <View style={{padding: spacing.md}}>
              <View style={{paddingBottom: spacing.md}}>
                <Button
                  text="Add Exercise"
                  onPress={() => setActiveModal('selectExercise')}
                />
              </View>
              <Button
                text={isEdit ? 'Update Plan' : 'Save Plan'}
                onPress={handleSubmit as any}
              />
            </View>
          );

          renderedExerciseIds.current.clear(); // ✅ clear only once before rendering begins

          return (
            <FieldArray name="exercises">
              {({push}) => {
                pushRef.current = push;

                return (
                  <>
                    {reorderMode ? (
                      <AnimatedScrollView
                        ref={scrollRef}
                        onScroll={scrollHandler}
                        scrollEventThrottle={16}
                        onLayout={event => {
                          scrollViewHeight.value =
                            event.nativeEvent.layout.height;
                          runOnJS(setScrollViewReady)(true);
                        }}
                        onContentSizeChange={(w, h) => {
                          contentHeight.value = h;
                        }}
                        scrollEnabled={true}
                        style={{flex: 1}}>
                        <View style={{padding: spacing.md}}>
                          <Title
                            text="Reorder Plan"
                            subtitle="Drag exercises to reorder or drop them into a group"
                          />
                          <Button
                            text="Done Reordering"
                            onPress={() => setReorderMode(false)}
                          />

                          {planItems.map(pi =>
                            pi.type === 'group' ? (
                              <MeasuredGroupItem
                                key={`group-${pi.data.id}`}
                                ref={r => {
                                  if (r) {
                                    groupRefs.current.set(
                                      String(pi.data.id),
                                      r,
                                    );
                                  } else {
                                    groupRefs.current.delete(
                                      String(pi.data.id),
                                    );
                                  }
                                }}
                                group={pi.data}
                                onDrop={handleDrop}
                                simultaneousHandlers={scrollRef}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onDragMove={handleDragMove}
                                layoutVersion={layoutVersion}
                                scrollLayoutVersion={scrollLayoutVersion}>
                                <ExerciseGroupCard
                                  label={getGroupLabel(pi.data)}
                                  borderColor={theme.colors.accentStart}
                                  textColor={theme.colors.textPrimary}>
                                  {getGroupedExercises(pi.data.id).map(ex => (
                                    <MeasuredExerciseItem
                                      key={ex.instanceId}
                                      ref={r => {
                                        if (r) {
                                          exerciseRefs.current.set(
                                            ex.instanceId,
                                            r,
                                          );
                                        } else {
                                          exerciseRefs.current.delete(
                                            ex.instanceId,
                                          );
                                        }
                                      }}
                                      item={ex}
                                      onDrop={handleDrop}
                                      simultaneousHandlers={scrollRef}
                                      onDragStart={handleDragStart}
                                      onDragEnd={handleDragEnd}
                                      onDragMove={handleDragMove}
                                      layoutVersion={layoutVersion}
                                      scrollLayoutVersion={scrollLayoutVersion}>
                                      <View
                                        style={{
                                          marginHorizontal: spacing.md,
                                          marginVertical: spacing.sm,
                                          backgroundColor: theme.colors.surface,
                                          padding: spacing.sm,
                                          borderRadius: 6,
                                          borderWidth: 1,
                                          borderColor: theme.colors.accentEnd,
                                        }}>
                                        <Text
                                          style={{
                                            color: theme.colors.textPrimary,
                                            fontWeight: 'bold',
                                          }}>
                                          {ex.exerciseName}
                                        </Text>
                                        <Text
                                          style={{
                                            color: theme.colors.textSecondary,
                                          }}>
                                          {renderSummary(ex)}
                                        </Text>
                                      </View>
                                    </MeasuredExerciseItem>
                                  ))}
                                  <GroupDropPlaceholder
                                    groupId={pi.data.id}
                                    hoveredGroupId={hoveredGroupId}
                                  />
                                </ExerciseGroupCard>
                              </MeasuredGroupItem>
                            ) : (
                              <MeasuredExerciseItem
                                key={pi.data.instanceId}
                                ref={r => {
                                  if (r) {
                                    exerciseRefs.current.set(
                                      pi.data.instanceId,
                                      r,
                                    );
                                  } else {
                                    exerciseRefs.current.delete(
                                      pi.data.instanceId,
                                    );
                                  }
                                }}
                                item={pi.data}
                                onDrop={handleDrop}
                                simultaneousHandlers={scrollRef}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onDragMove={handleDragMove}
                                layoutVersion={layoutVersion}
                                scrollLayoutVersion={scrollLayoutVersion}>
                                <View
                                  style={{
                                    backgroundColor: theme.colors.background,
                                    padding: spacing.md,
                                    marginBottom: spacing.md,
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: theme.colors.accentStart,
                                  }}>
                                  <Text
                                    style={{
                                      color: theme.colors.textPrimary,
                                      fontWeight: 'bold',
                                    }}>
                                    {pi.data.exerciseName}
                                  </Text>
                                  <Text
                                    style={{
                                      color: theme.colors.textSecondary,
                                    }}>
                                    {renderSummary(pi.data)}
                                  </Text>
                                </View>
                              </MeasuredExerciseItem>
                            ),
                          )}
                        </View>
                      </AnimatedScrollView>
                    ) : (
                      <FlatList
                        data={(() => {
                          const groupedMap: Record<
                            number,
                            ExerciseFormEntry[]
                          > = {};

                          values.exercises.forEach(ex => {
                            if (ex.groupId != null) {
                              if (!groupedMap[ex.groupId])
                                groupedMap[ex.groupId] = [];
                              groupedMap[ex.groupId].push(ex);
                            }
                          });

                          const displayList: RenderItem[] = [];

                          planItems.forEach(item => {
                            if (item.type === 'group') {
                              displayList.push({
                                type: 'group',
                                group: item.data,
                              });
                              (groupedMap[item.data.id] ?? []).forEach(ex => {
                                displayList.push({
                                  type: 'exercise',
                                  exercise: ex,
                                });
                              });
                            } else {
                              displayList.push({
                                type: 'exercise',
                                exercise: item.data,
                              });
                            }
                          });
                          return displayList;
                        })()}
                        keyExtractor={item =>
                          item.type === 'group'
                            ? `group-${item.group.id}`
                            : `exercise-${item.exercise.instanceId}`
                        }
                        ListHeaderComponent={ListHeader}
                        ListFooterComponent={ListFooter}
                        renderItem={({item}) => {
                          if (item.type === 'group') {
                            const groupExercises = getGroupedExercises(
                              item.group.id,
                            );

                            groupExercises.forEach(ex =>
                              renderedExerciseIds.current.add(ex.instanceId),
                            ); // mark them as rendered

                            return (
                              <View
                                style={{
                                  marginHorizontal: spacing.md,
                                  marginBottom: spacing.lg,
                                }}>
                                <ExerciseGroupCard
                                  label={getGroupLabel(item.group)}
                                  borderColor={theme.colors.accentStart}
                                  textColor={theme.colors.textPrimary}>
                                  {groupExercises.map(exercise => {
                                    const idx = values.exercises.findIndex(
                                      e => e.instanceId === exercise.instanceId,
                                    );
                                    const isExpanded =
                                      expandedExerciseIndex === idx;

                                    return (
                                      <View
                                        key={exercise.instanceId}
                                        style={{
                                          marginVertical: spacing.sm,
                                          padding: spacing.sm,
                                          backgroundColor: theme.colors.surface,
                                          borderRadius: 6,
                                          borderWidth: 1,
                                          borderColor: theme.colors.accentEnd,
                                        }}>
                                        <TouchableOpacity
                                          onPress={() =>
                                            setExpandedExerciseIndex(
                                              isExpanded ? null : idx,
                                            )
                                          }>
                                          <View
                                            style={{
                                              flexDirection: 'row',
                                              justifyContent: 'space-between',
                                            }}>
                                            <Text
                                              style={{
                                                color: theme.colors.textPrimary,
                                                fontWeight: 'bold',
                                              }}>
                                              #{idx + 1} {exercise.exerciseName}
                                            </Text>
                                            <FontAwesome
                                              name={
                                                isExpanded
                                                  ? 'chevron-up'
                                                  : 'chevron-down'
                                              }
                                              style={{
                                                fontSize: 16,
                                                color: theme.colors.accentStart,
                                                paddingRight: 5,
                                              }}
                                            />
                                          </View>
                                        </TouchableOpacity>

                                        {isExpanded && (
                                          <>
                                            {/* Expandable content here (sets, metrics, etc.) */}
                                            <FormInput
                                              label="Sets"
                                              value={String(
                                                exercise.targetSets,
                                              )}
                                              onChangeText={text =>
                                                setFieldValue(
                                                  `exercises[${idx}].targetSets`,
                                                  parseInt(text, 10) || 0,
                                                )
                                              }
                                              keyboardType="numeric"
                                            />
                                            <TargetMetricInputGroup
                                              exerciseId={exercise.exerciseId}
                                              values={exercise.targetMetrics}
                                              onChange={(
                                                metricId,
                                                field,
                                                value,
                                              ) => {
                                                const updated =
                                                  exercise.targetMetrics.map(
                                                    m =>
                                                      m.metricId === metricId
                                                        ? {...m, [field]: value}
                                                        : m,
                                                  );
                                                setFieldValue(
                                                  `exercises[${idx}].targetMetrics`,
                                                  updated,
                                                );
                                              }}
                                              errors={
                                                (errors.exercises?.[idx] as any)
                                                  ?.targetMetrics
                                              }
                                              touched={
                                                touched.exercises?.[idx]
                                                  ?.targetMetrics
                                              }
                                            />
                                          </>
                                        )}
                                      </View>
                                    );
                                  })}
                                </ExerciseGroupCard>
                              </View>
                            );
                          }

                          // Skip rendering this exercise again if it was rendered in a group
                          if (
                            renderedExerciseIds.current.has(
                              item.exercise.instanceId,
                            )
                          ) {
                            return null;
                          }

                          // Render ungrouped exercises
                          const exercise = item.exercise;
                          const idx = values.exercises.findIndex(
                            e => e.instanceId === exercise.instanceId,
                          );
                          const isExpanded = expandedExerciseIndex === idx;

                          return (
                            <View
                              key={exercise.instanceId}
                              style={{
                                marginHorizontal: spacing.md,
                                marginBottom: spacing.sm,
                                padding: spacing.sm,
                                borderRadius: 8,
                                backgroundColor: theme.colors.background,
                                borderWidth: 1,
                                borderColor: theme.colors.accentStart,
                              }}>
                              <TouchableOpacity
                                onPress={() =>
                                  setExpandedExerciseIndex(
                                    isExpanded ? null : idx,
                                  )
                                }>
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                  }}>
                                  <Text
                                    style={{
                                      color: theme.colors.textPrimary,
                                      fontWeight: 'bold',
                                    }}>
                                    #{idx + 1} {exercise.exerciseName}
                                  </Text>
                                  <FontAwesome
                                    name={
                                      isExpanded ? 'chevron-up' : 'chevron-down'
                                    }
                                    style={{
                                      fontSize: 16,
                                      color: theme.colors.accentStart,
                                      paddingRight: 5,
                                    }}
                                  />
                                </View>
                              </TouchableOpacity>

                              {isExpanded && (
                                <>
                                  <FormInput
                                    label="Sets"
                                    value={String(exercise.targetSets)}
                                    onChangeText={text =>
                                      setFieldValue(
                                        `exercises[${idx}].targetSets`,
                                        parseInt(text, 10) || 0,
                                      )
                                    }
                                    keyboardType="numeric"
                                  />
                                  <TargetMetricInputGroup
                                    exerciseId={exercise.exerciseId}
                                    values={exercise.targetMetrics}
                                    onChange={(metricId, field, value) => {
                                      const updated =
                                        exercise.targetMetrics.map(m =>
                                          m.metricId === metricId
                                            ? {...m, [field]: value}
                                            : m,
                                        );
                                      setFieldValue(
                                        `exercises[${idx}].targetMetrics`,
                                        updated,
                                      );
                                    }}
                                    errors={
                                      (errors.exercises?.[idx] as any)
                                        ?.targetMetrics
                                    }
                                    touched={
                                      touched.exercises?.[idx]?.targetMetrics
                                    }
                                  />
                                </>
                              )}
                            </View>
                          );
                        }}
                      />
                    )}
                    <ModalWrapper
                      visible={!!activeModal}
                      onClose={() => setActiveModal(null)}>
                      {activeModal === 'trainingGoalPicker' && (
                        <TrainingGoalPickerModal
                          visible
                          trainingGoals={workoutMeta?.getTrainingGoals ?? []}
                          selectedId={values.trainingGoalId}
                          onSelect={goalId => {
                            setFieldValue('trainingGoalId', goalId);
                            setActiveModal(null);
                          }}
                          onClose={() => setActiveModal(null)}
                        />
                      )}
                      {activeModal === 'difficultyPicker' && (
                        <DifficultyPickerModal
                          visible
                          selectedLevel={values.experienceLevel ?? 'BEGINNER'}
                          onSelect={level => {
                            setFieldValue('experienceLevel', level);
                            setActiveModal(null);
                          }}
                          onClose={() => setActiveModal(null)}
                        />
                      )}
                      {activeModal === 'muscleGroupPicker' && (
                        <MuscleGroupPickerModal
                          muscleGroups={workoutMeta?.getMuscleGroups ?? []}
                          selectedIds={values.muscleGroupIds}
                          onChange={(ids: number[]) =>
                            setFieldValue('muscleGroupIds', ids)
                          }
                          onClose={() => setActiveModal(null)}
                          onRefetch={refetch}
                        />
                      )}
                      {activeModal === 'trainingMethodPicker' && (
                        <TrainingMethodPicker
                          selectedId={
                            selectedExerciseIndex !== null
                              ? (values.exercises[selectedExerciseIndex]
                                  ?.trainingMethodId ?? null)
                              : null
                          }
                          trainingMethods={
                            workoutMeta?.getTrainingGoals?.find(
                              (g: {id: number; trainingMethods: any[]}) =>
                                g.id === values.trainingGoalId,
                            )?.trainingMethods ?? []
                          }
                          onSelect={id => {
                            if (selectedExerciseIndex !== null) {
                              setFieldValue(
                                `exercises[${selectedExerciseIndex}].trainingMethodId`,
                                id,
                              );
                            }
                            setActiveModal(null);
                            setSelectedExerciseIndex(null);
                          }}
                          onClose={() => setActiveModal(null)}
                        />
                      )}
                      {activeModal === 'selectExercise' && (
                        <SelectExerciseModal
                          onClose={() => setActiveModal(null)}
                          filteredExercises={filteredExercises}
                          onSelect={newExercises => {
                            if (!pushRef.current) {
                              console.error(
                                '[DEBUG] FATAL: pushRef.current is not set!',
                              );
                              return;
                            }
                            try {
                              newExercises.forEach(e => {
                                const newTargetMetrics =
                                  createPlanningTargetMetrics(e.id);
                                const getNextOrder = (): number =>
                                  getNextGlobalOrder(
                                    values.exercises,
                                    values.groups,
                                  );
                                const newExerciseObject = {
                                  instanceId: generateUniqueId(),
                                  exerciseId: e.id,
                                  exerciseName: e.name,
                                  targetSets: 3,
                                  targetMetrics: newTargetMetrics,
                                  isWarmup: false,
                                  trainingMethodId: undefined,
                                  groupId: null,
                                  order: getNextOrder(), // global ordering
                                };
                                pushRef.current(newExerciseObject);
                              });
                              setExpandedExerciseIndex(
                                values.exercises.length +
                                  newExercises.length -
                                  1,
                              );
                              setActiveModal(null);
                            } catch (error) {
                              console.error(
                                '[DEBUG] An error occurred while adding an exercise:',
                                error,
                              );
                            }
                          }}
                        />
                      )}
                      {activeModal === 'groupMethodPicker' && (
                        <TrainingMethodPicker
                          selectedId={null}
                          trainingMethods={
                            workoutMeta?.getTrainingMethods?.filter(
                              (m: any) => m.minGroupSize != null,
                            ) ?? []
                          }
                          onSelect={id => {
                            if (stagedGroupId != null) {
                              const nextOrder = getNextGlobalOrder(
                                values.exercises,
                                values.groups,
                              );
                              const newGroup = {
                                id: stagedGroupId,
                                trainingMethodId: id,
                                order: nextOrder,
                              };
                              setFieldValue('groups', [
                                ...values.groups,
                                newGroup,
                              ]);

                              setStagedGroupId(null);
                              setActiveModal(null);
                            }
                          }}
                          onClose={() => {
                            setActiveModal(null);
                            setStagedGroupId(null);
                          }}
                        />
                      )}
                    </ModalWrapper>
                  </>
                );
              }}
            </FieldArray>
          );
        }}
      </Formik>
      <ToastContainer />
    </ScreenLayout>
  );
}