import React, {useState, useRef, useMemo, useEffect} from 'react';
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

// IMPORTS FOR THE CUSTOM DRAG-AND-DROP
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  ScrollView,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  useAnimatedRef,
  scrollTo,
  useAnimatedScrollHandler,
  useWorkletCallback,
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
};

type DraggableItemProps = {
  item: ExerciseFormEntry;
  children: React.ReactNode;
  onDrop: (x: number, y: number, instanceId: string) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragMove?: (x: number, y: number) => void;
  simultaneousHandlers?: any;
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

type Layout = {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Scroll offset of the parent ScrollView when this layout was measured */
  scrollOffset: number;
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

// --- DRAGGABLE ITEM COMPONENT ---
const DraggableItem: React.FC<DraggableItemProps> = ({
  item,
  children,
  onDrop,
  onDragStart,
  onDragEnd,
  onDragMove,
  simultaneousHandlers,
  scrollOffset,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startScrollY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const [draggingJS, setDraggingJS] = useState(false);
  const [layoutSize, setLayoutSize] = useState<{width: number; height: number}>(
    {
      width: 0,
      height: 0,
    },
  );

  const handleStartJS = () => {
    if (!draggingJS) {
      setDraggingJS(true);
      if (onDragStart) {
        onDragStart();
      }
    }
  };

  const handleEndJS = () => {
    if (draggingJS) {
      setDraggingJS(false);
      if (onDragEnd) {
        onDragEnd();
      }
    }
  };

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    {startX: number; startY: number; startScrollY: number}
  >({
    onBegin: () => {
      isDragging.value = true;
      startScrollY.value = scrollOffset?.value ?? 0;
      runOnJS(handleStartJS)();
    },
    onStart: (_, ctx) => {
      isDragging.value = true;
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
      startScrollY.value = scrollOffset?.value ?? 0;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
      if (onDragMove) {
        onDragMove(event.absoluteX, event.absoluteY);
      }
    },
    onEnd: event => {
      runOnJS(onDrop)(event.absoluteX, event.absoluteY, item.instanceId);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0, {}, finished => {
        if (finished) {
          isDragging.value = false;
          runOnJS(handleEndJS)();
        }
      });
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    const scrollDiff = isDragging.value
      ? (scrollOffset?.value ?? 0) - startScrollY.value
      : 0;
    return {
      position: isDragging.value ? 'absolute' : 'relative',
      zIndex: isDragging.value ? 100 : 0,
      transform: [
        {translateX: translateX.value},
        {translateY: translateY.value + scrollDiff},
      ],
      elevation: isDragging.value ? 10 : 0,
      shadowRadius: isDragging.value ? 15 : 1,
      shadowOpacity: isDragging.value ? 0.2 : 0,
      shadowOffset: {width: 0, height: isDragging.value ? 10 : 1},
    };
  });

  return (
    <View
      style={{
        width: '100%',
        height: layoutSize.height > 0 ? layoutSize.height : undefined,
      }}>
      {draggingJS && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.3,
          }}>
          {children}
        </View>
      )}
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
          onTouchStart={handleStartJS}
          onTouchEnd={handleEndJS}
          style={[animatedStyle, {width: '100%'}]}>
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const HEADER_HEIGHT_OFFSET = 61;

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

  const groupLayouts = useRef<Record<number, Layout>>({});
  const exerciseLayouts = useRef<Record<string, Layout>>({});

  const scrollOffsetY = useSharedValue(0);
  const scrollRef = useAnimatedRef<ScrollView>();
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const scrollViewHeight = useSharedValue(0);
  const contentHeight = useSharedValue(0);

  const handleDragStart = () => {
    setIsDraggingItem(true);
    scrollRef.current?.setNativeProps({scrollEnabled: false});
  };
  const handleDragEnd = () => {
    setIsDraggingItem(false);
    scrollRef.current?.setNativeProps({scrollEnabled: true});
  };

  const handleAutoScroll = useWorkletCallback((x: number, y: number) => {
    const threshold = 80;
    const step = 20;
    const topBoundary = HEADER_HEIGHT_OFFSET + threshold;
    const bottomBoundary =
      HEADER_HEIGHT_OFFSET + scrollViewHeight.value - threshold;

    if (y < topBoundary) {
      const newOffset = Math.max(0, scrollOffsetY.value - step);
      if (newOffset !== scrollOffsetY.value) {
        scrollOffsetY.value = newOffset;
        scrollTo(scrollRef, 0, newOffset, false);
      }
    } else if (y > bottomBoundary) {
      const maxOffset = Math.max(
        0,
        contentHeight.value - scrollViewHeight.value,
      );
      const newOffset = Math.min(maxOffset, scrollOffsetY.value + step);
      if (newOffset !== scrollOffsetY.value) {
        scrollOffsetY.value = newOffset;
        scrollTo(scrollRef, 0, newOffset, false);
      }
    }
  }, []);

  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollOffsetY.value = event.contentOffset.y;
  });

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };
  const groupIdCounterRef = useRef(1);

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
            });
          }
        }
      }
      return Array.from(seen.values());
    }

    if (isFromSession) {
      const exercises = plan.exercises.map((ex: any) => ({
        instanceId: generateUniqueId(),
        exerciseId: ex.exerciseId ?? ex.exercise.id,
        exerciseName: ex.exerciseName ?? ex.exercise.name,
        targetSets: ex.targetSets,
        targetMetrics: ex.targetMetrics?.length
          ? ex.targetMetrics
          : createPlanningTargetMetrics(ex.exerciseId ?? ex.exercise.id),
        trainingMethodId: ex.trainingMethodId ?? ex.trainingMethod?.id ?? null,
        groupId: ex.groupId ?? null,
        isWarmup: ex.isWarmup ?? false,
      }));

      return {
        name: plan.name,
        trainingGoalId: plan.trainingGoal?.id,
        intensityPresetId: plan.intensityPreset?.id ?? undefined,
        experienceLevel: plan.intensityPreset?.experienceLevel ?? undefined,
        muscleGroupIds: [],
        exercises,
        groups: deriveGroupsFromExercises(exercises),
      };
    }

    const exercises = plan.exercises.map((ex: any) => ({
      instanceId: generateUniqueId(),
      exerciseId: ex.exerciseId,
      exerciseName: ex.exerciseName,
      targetSets: ex.targetSets,
      targetMetrics:
        ex.targetMetrics ?? createPlanningTargetMetrics(ex.exerciseId),
      trainingMethodId: ex.trainingMethodId ?? null,
      groupId: ex.groupId ?? null,
      isWarmup: ex.isWarmup ?? false,
    }));

    return {
      name: plan.name,
      trainingGoalId: plan.trainingGoal?.id,
      intensityPresetId: plan.intensityPreset?.id ?? undefined,
      experienceLevel: plan.intensityPreset?.experienceLevel ?? undefined,
      muscleGroupIds: plan.muscleGroups.map((mg: any) => mg.id),
      exercises,
      groups: deriveGroupsFromExercises(exercises),
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

  type MeasuredExerciseItemProps = {
    item: ExerciseFormEntry;
    onDrop: (x: number, y: number, id: string) => void;
    children: React.ReactNode; // ✅ add this
    simultaneousHandlers?: any;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    onDragMove?: (x: number, y: number) => void;
  };

  const MeasuredExerciseItemComponent = ({
    item,
    onDrop,
    children,
    simultaneousHandlers,
    onDragStart,
    onDragEnd,
    onDragMove,
  }: MeasuredExerciseItemProps) => {
    const ref = useRef<View>(null);

    useEffect(() => {
      setTimeout(() => {
        ref.current?.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) {
            exerciseLayouts.current[item.instanceId] = {
              x,
              y,
              width,
              height,
              scrollOffset: scrollOffsetY.value,
            };
            console.log(
              'measured',
              item.instanceId,
              x,
              y,
              width,
              height,
              'offset',
              scrollOffsetY.value,
            );
          }
        });
      }, 100);
    }, [item.instanceId]);

    return (
      <View ref={ref}>
        <DraggableItem
          item={item}
          onDrop={onDrop}
          simultaneousHandlers={simultaneousHandlers}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragMove={onDragMove}
          scrollOffset={scrollOffsetY}>
          {children}
        </DraggableItem>
      </View>
    );
  };

  const MeasuredExerciseItem = React.memo(MeasuredExerciseItemComponent);

  type MeasuredGroupZoneProps = {
    group: ExerciseGroup;
    children: React.ReactNode;
  };

  const MeasuredGroupZone: React.FC<MeasuredGroupZoneProps> = ({
    group,
    children,
  }) => {
    const ref = useRef<View>(null);

    useEffect(() => {
      setTimeout(() => {
        ref.current?.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) {
            groupLayouts.current[group.id] = {
              x,
              y,
              width,
              height,
              scrollOffset: scrollOffsetY.value,
            };
            console.log(
              '📏 Group measured:',
              group.id,
              x,
              y,
              width,
              height,
              'offset',
              scrollOffsetY.value,
            );
          }
        });
      }, 100); // slight delay to ensure layout settles
    }, [group.id]);

    return <View ref={ref}>{children}</View>;
  };

  return (
    <ScreenLayout>
      <Formik<FormValues>
        enableReinitialize
        initialValues={formInitialValues}
        validationSchema={validationSchema}
        onSubmit={async values => {
          const methodById = new Map<number, any>(
            (workoutMeta?.getTrainingMethods ?? []).map((m: any) => [m.id, m]),
          );

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
            exercises: [...values.exercises]
              .sort((a, b) => {
                // Sort by groupId (nulls last), then by order within group
                if (a.groupId === b.groupId) return a.order - b.order;
                if (a.groupId == null) return 1;
                if (b.groupId == null) return -1;
                return a.groupId - b.groupId;
              })
              .map((ex, index) => {
                const isInValidGroup =
                  ex.groupId && validGroupIds.has(ex.groupId);
                return {
                  exerciseId: ex.exerciseId,
                  order: index,
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
                  trainingMethodId: isInValidGroup
                    ? (ex.trainingMethodId ?? null)
                    : null,
                  groupId: isInValidGroup ? (ex.groupId ?? null) : null,
                };
              }),
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

          const getGroupedExercises = (groupId: number) => {
            return values.exercises
              .filter(ex => ex.groupId === groupId)
              .sort((a, b) => a.order - b.order);
          };

          const getUngroupedExercises = () => {
            return values.exercises
              .filter(ex => ex.groupId == null)
              .sort((a, b) => a.order - b.order);
          };

          const handleDrop = (
            x: number,
            y: number,
            draggedItemInstanceId: string,
          ) => {
            const draggedItem = values.exercises.find(
              ex => ex.instanceId === draggedItemInstanceId,
            );
            if (!draggedItem) return;

            // Priority 1: Check if dropped on another exercise to reorder
            // This will now correctly trigger for items within the same group.
            for (const targetInstanceId in exerciseLayouts.current) {
              if (targetInstanceId === draggedItemInstanceId) continue;
              const layout = exerciseLayouts.current[targetInstanceId];
              const adjustedY =
                layout.y - (scrollOffsetY.value - layout.scrollOffset);
              if (
                x >= layout.x &&
                x <= layout.x + layout.width &&
                y >= adjustedY &&
                y <= adjustedY + layout.height
              ) {
                const targetItem = values.exercises.find(
                  ex => ex.instanceId === targetInstanceId,
                );
                // Only reorder if they are in the same group (or both are ungrouped)
                if (targetItem && targetItem.groupId === draggedItem.groupId) {
                  reorderExercises(
                    draggedItemInstanceId,
                    targetInstanceId,
                    values.exercises,
                    setFieldValue,
                  );
                  return; // Reordering handled, so we're done.
                }
              }
            }

            // Priority 2: Check if dropped on a group zone to change its group
            for (const groupIdStr in groupLayouts.current) {
              const layout = groupLayouts.current[groupIdStr];
              const adjustedY =
                layout.y - (scrollOffsetY.value - layout.scrollOffset);
              if (
                x >= layout.x &&
                x <= layout.x + layout.width &&
                y >= adjustedY &&
                y <= adjustedY + layout.height
              ) {
                const targetGroupId = parseInt(groupIdStr, 10);
                // Only update if it's being moved to a *different* group
                if (draggedItem.groupId !== targetGroupId) {
                  updateExerciseGroup(
                    draggedItemInstanceId,
                    targetGroupId,
                    values.exercises,
                    values.groups,
                    setFieldValue,
                  );
                }
                return; // Group assignment handled (or skipped), so we're done.
              }
            }

            // Priority 3: Dropped in empty space, so un-group it
            updateExerciseGroup(
              draggedItemInstanceId,
              null, // Setting groupId to null un-groups it
              values.exercises,
              values.groups,
              setFieldValue,
            );
          };
          const updateExerciseGroup = (
            instanceId: string,
            groupId: number | null,
            currentExercises: ExerciseFormEntry[],
            currentGroups: ExerciseGroup[],
            setFieldValueFn: (field: string, value: any) => void,
          ) => {
            console.log(
              `💾 Updating group assignment: ${instanceId} → group ${groupId}`,
            );
            const exerciseIndex = currentExercises.findIndex(
              ex => ex.instanceId === instanceId,
            );
            if (exerciseIndex === -1) return;
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
              updatedGroups.push({
                id: groupId,
                trainingMethodId: methodId ?? 0,
              });
            }
            const updatedExercises = [...currentExercises];
            if (exerciseIndex === -1) return;

            const nextOrder = currentExercises.filter(
              e => e.groupId === groupId,
            ).length;

            updatedExercises[exerciseIndex] = {
              ...updatedExercises[exerciseIndex],
              groupId,
              trainingMethodId: newTrainingMethodId,
              order: nextOrder,
            };

            setFieldValueFn('groups', updatedGroups);
            setFieldValueFn('exercises', updatedExercises);
            setFieldValueFn('groups', updatedGroups);
            setFieldValueFn('exercises', updatedExercises);
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

            // Only allow reordering within same groupId (including null for ungrouped)
            if (draggedItem.groupId !== targetItem.groupId) return;

            const reorderedExercises = [...currentExercises]; // Create a mutable copy

            const draggedIndex = reorderedExercises.findIndex(
              ex => ex.instanceId === draggedId,
            );
            const targetIndex = reorderedExercises.findIndex(
              ex => ex.instanceId === targetId,
            );

            if (draggedIndex === -1 || targetIndex === -1) return;

            // 1. Remove the dragged item from its original position
            const [movedItem] = reorderedExercises.splice(draggedIndex, 1);

            // 2. Find the new target index in the modified array
            const newTargetIndex = reorderedExercises.findIndex(
              ex => ex.instanceId === targetId,
            );

            // 3. Insert it at the target's position
            reorderedExercises.splice(newTargetIndex, 0, movedItem);

            // 4. Re-assign the 'order' property for ALL exercises to guarantee consistency
            const finalExercises = reorderedExercises.map((ex, index) => ({
              ...ex,
              order: index, // This is the key change: re-index everything
            }));

            setFieldValueFn('exercises', finalExercises);
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
                        onLayout={e => {
                          scrollViewHeight.value = e.nativeEvent.layout.height;
                        }}
                        onContentSizeChange={(w, h) => {
                          contentHeight.value = h;
                        }}
                        scrollEventThrottle={16}
                        scrollEnabled={!isDraggingItem}
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

                          <Text
                            style={{
                              color: theme.colors.textPrimary,
                              fontSize: 18,
                              fontWeight: 'bold',
                              marginTop: spacing.lg,
                              marginBottom: spacing.sm,
                            }}>
                            Groups
                          </Text>
                          {values.groups.map(group => (
                            <MeasuredGroupZone
                              key={`group-zone-${group.id}`}
                              group={group}>
                              <ExerciseGroupCard
                                label={getGroupLabel(group)}
                                borderColor={theme.colors.accentStart}
                                textColor={theme.colors.textPrimary}>
                                {values.exercises
                                  .filter(ex => ex.groupId === group.id)
                                  .map(item => (
                                    <MeasuredExerciseItem
                                      key={item.instanceId}
                                      item={item}
                                      onDrop={handleDrop}
                                      simultaneousHandlers={scrollRef}
                                      onDragStart={handleDragStart}
                                      onDragEnd={handleDragEnd}
                                      onDragMove={handleAutoScroll}>
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
                                          {item.exerciseName}
                                        </Text>
                                        <Text
                                          style={{
                                            color: theme.colors.textSecondary,
                                          }}>
                                          {renderSummary(item)}
                                        </Text>
                                      </View>
                                    </MeasuredExerciseItem>
                                  ))}

                                {values.exercises.filter(
                                  ex => ex.groupId === group.id,
                                ).length === 0 && (
                                  <View
                                    style={{
                                      height: 60,
                                      justifyContent: 'center',
                                      alignItems: 'center',
                                    }}>
                                    <Text
                                      style={{
                                        color: theme.colors.textSecondary,
                                      }}>
                                      Drop exercises here
                                    </Text>
                                  </View>
                                )}
                              </ExerciseGroupCard>
                            </MeasuredGroupZone>
                          ))}

                          <Text
                            style={{
                              color: theme.colors.textPrimary,
                              fontSize: 18,
                              fontWeight: 'bold',
                              marginTop: spacing.lg,
                              marginBottom: spacing.sm,
                            }}>
                            Unassigned Exercises
                          </Text>
                          <View style={{marginHorizontal: spacing.md}}>
                            {getUngroupedExercises().map(item => (
                              <MeasuredExerciseItem
                                key={item.instanceId}
                                item={item}
                                onDrop={handleDrop}
                                simultaneousHandlers={scrollRef}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onDragMove={handleAutoScroll}>
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
                                    {item.exerciseName}
                                  </Text>
                                  <Text
                                    style={{
                                      color: theme.colors.textSecondary,
                                    }}>
                                    {renderSummary(item)}
                                  </Text>
                                </View>
                              </MeasuredExerciseItem>
                            ))}
                          </View>
                        </View>
                      </AnimatedScrollView>
                    ) : (
                      <FlatList
                        data={(() => {
                          const groupedExercisesMap: Record<
                            number,
                            ExerciseFormEntry[]
                          > = {};
                          values.exercises.forEach(ex => {
                            if (ex.groupId != null) {
                              if (!groupedExercisesMap[ex.groupId])
                                groupedExercisesMap[ex.groupId] = [];
                              groupedExercisesMap[ex.groupId].push(ex);
                            }
                          });

                          const displayList: RenderItem[] = [];

                          values.groups.forEach(group => {
                            displayList.push({type: 'group', group});
                            (groupedExercisesMap[group.id] ?? []).forEach(
                              ex => {
                                displayList.push({
                                  type: 'exercise',
                                  exercise: ex,
                                });
                              },
                            );
                          });

                          values.exercises
                            .filter(ex => ex.groupId == null)
                            .forEach(ex => {
                              displayList.push({
                                type: 'exercise',
                                exercise: ex,
                              });
                            });
                          console.log(
                            '📦 Rendered displayList:',
                            displayList.map(i =>
                              i.type === 'group'
                                ? `Group ${i.group.id}`
                                : `Exercise ${i.exercise.exerciseName} → group ${i.exercise.groupId}`,
                            ),
                          );
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
                                const getNextUngroupedOrder = (): number => {
                                  const ungrouped = values.exercises.filter(
                                    ex => ex.groupId == null,
                                  );
                                  if (ungrouped.length === 0) return 0;
                                  return (
                                    Math.max(
                                      ...ungrouped.map(ex => ex.order ?? 0),
                                    ) + 1
                                  );
                                };
                                const newExerciseObject = {
                                  instanceId: generateUniqueId(),
                                  exerciseId: e.id,
                                  exerciseName: e.name,
                                  targetSets: 3,
                                  targetMetrics: newTargetMetrics,
                                  isWarmup: false,
                                  trainingMethodId: undefined,
                                  groupId: null,
                                  order: getNextUngroupedOrder(), // 👈 custom function, defined below
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
                              const newGroup = {
                                id: stagedGroupId,
                                trainingMethodId: id,
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
