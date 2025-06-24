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
  order: number;
};

type DragData = {type: 'exercise' | 'group'; id: string};

type DraggableItemProps = {
  item: DragData;
  children: React.ReactNode;
  onDrop: (x: number, y: number, data: DragData) => void;
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
      startScrollY.value = scrollOffset?.value ?? 0;
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
      // runOnJS(console.log)('DraggableItem onEnd', {
      //   x: event.absoluteX,
      //   y: event.absoluteY,
      //   id: item.id,
      //   type: item.type,
      // });
      runOnJS(onDrop)(event.absoluteX, event.absoluteY, item);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0, {}, finished => {
        if (finished) {
          isDragging.value = false;
          runOnJS(handleTouchEnd)();
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

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: isDragging.value ? 0.3 : 0,
  }));

  return (
    <View
      style={{
        width: '100%',
        height: layoutSize.height > 0 ? layoutSize.height : undefined,
      }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          },
          overlayAnimatedStyle,
        ]}>
        {children}
      </Animated.View>
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
  const isDraggingItem = useRef(false);
  const scrollViewHeight = useSharedValue(0);
  const contentHeight = useSharedValue(0);

  const handleDragStart = () => {
    isDraggingItem.current = true;
    scrollRef.current?.setNativeProps({scrollEnabled: false});
  };
  const handleDragEnd = () => {
    isDraggingItem.current = false;
    scrollRef.current?.setNativeProps({scrollEnabled: true});
  };

  const handleAutoScroll = useWorkletCallback((x: number, y: number) => {
    const threshold = 100;
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

  const confirmAsync = (title: string, message: string) =>
    new Promise<boolean>(resolve => {
      Alert.alert(title, message, [
        {text: 'Cancel', style: 'cancel', onPress: () => resolve(false)},
        {text: 'Continue', onPress: () => resolve(true)},
      ]);
    });

  const renderedExerciseIds = useRef<Set<string>>(new Set());

  function convertPlanToInitialValues(plan: any): FormValues {
    console.log('workout plan: ', plan);
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
      instanceId: generateUniqueId(),
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
    onDrop: (x: number, y: number, data: DragData) => void;
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

    const measure = () => {
      ref.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          exerciseLayouts.current[item.instanceId] = {
            x,
            y,
            width,
            height,
            scrollOffset: scrollOffsetY.value,
          };
        }
      });
    };

    useEffect(() => {
      const timer = setTimeout(measure, 100);
      return () => clearTimeout(timer);
    }, [item.instanceId]);

    return (
      <View ref={ref} onLayout={measure}>
        <DraggableItem
          item={{type: 'exercise', id: item.instanceId}}
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

  type MeasuredGroupItemProps = {
    group: ExerciseGroup;
    onDrop: (x: number, y: number, data: DragData) => void;
    children: React.ReactNode;
    simultaneousHandlers?: any;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    onDragMove?: (x: number, y: number) => void;
  };

  const MeasuredGroupItem: React.FC<MeasuredGroupItemProps> = ({
    group,
    onDrop,
    children,
    simultaneousHandlers,
    onDragStart,
    onDragEnd,
    onDragMove,
  }) => {
    const ref = useRef<View>(null);

    const measure = () => {
      ref.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          groupLayouts.current[group.id] = {
            x,
            y,
            width,
            height,
            scrollOffset: scrollOffsetY.value,
          };
        }
      });
    };

    useEffect(() => {
      const timer = setTimeout(measure, 100);
      return () => clearTimeout(timer);
    }, [group.id]);

    return (
      <View ref={ref} onLayout={measure}>
        <DraggableItem
          item={{type: 'group', id: String(group.id)}}
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

          console.log(
            'Exercise orders before submit:',
            values.exercises.map(e => ({id: e.exerciseId, order: e.order})),
          );

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

          const planItems = getPlanItemsFromForm(values);

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
            draggedItemData: DragData,
          ) => {
            console.log('handleDrop', {
              x,
              y,
              draggedItemData,
              scrollOffset: scrollOffsetY.value,
            });
            if (draggedItemData.type === 'group') {
              // Reorder groups relative to other plan items
              const allLayouts: Record<string, Layout> = {
                ...exerciseLayouts.current,
                ...Object.fromEntries(
                  Object.entries(groupLayouts.current).map(([id, l]) => [
                    String(id),
                    l,
                  ]),
                ),
              };

              for (const targetId in allLayouts) {
                if (targetId === draggedItemData.id) continue;
                const layout = allLayouts[targetId];
                const adjustedY =
                  layout.y - (scrollOffsetY.value - layout.scrollOffset);
                if (
                  x >= layout.x &&
                  x <= layout.x + layout.width &&
                  y >= adjustedY &&
                  y <= adjustedY + layout.height
                ) {
                  const targetData: DragData = exerciseLayouts.current[targetId]
                    ? {type: 'exercise', id: targetId}
                    : {type: 'group', id: targetId};
                  reorderPlanItems(
                    draggedItemData,
                    targetData,
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

            // Priority 1: Check if dropped on another exercise to reorder
            // This will now correctly trigger for items within the same group.
            for (const targetInstanceId in exerciseLayouts.current) {
              if (targetInstanceId === draggedItemData.id) continue;
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
                    draggedItemData.id,
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
                    draggedItemData.id,
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
              draggedItemData.id,
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
              const nextGroupOrder =
                updatedGroups.length > 0
                  ? Math.max(...updatedGroups.map(g => g.order)) + 1
                  : 0;
              updatedGroups.push({
                id: groupId,
                trainingMethodId: methodId ?? 0,
                order: nextGroupOrder,
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
                          console.log('scrollViewHeight: ', scrollViewHeight);
                        }}
                        onContentSizeChange={(w, h) => {
                          contentHeight.value = h;
                        }}
                        scrollEventThrottle={16}
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
                                group={pi.data}
                                onDrop={handleDrop}
                                simultaneousHandlers={scrollRef}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onDragMove={handleAutoScroll}>
                                <ExerciseGroupCard
                                  label={getGroupLabel(pi.data)}
                                  borderColor={theme.colors.accentStart}
                                  textColor={theme.colors.textPrimary}>
                                  {getGroupedExercises(pi.data.id).map(ex => (
                                    <View
                                      key={ex.instanceId}
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
                                  ))}
                                </ExerciseGroupCard>
                              </MeasuredGroupItem>
                            ) : (
                              <MeasuredExerciseItem
                                key={pi.data.instanceId}
                                item={pi.data}
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
                              const nextOrder =
                                values.groups.length > 0
                                  ? Math.max(
                                      ...values.groups.map(g => g.order),
                                    ) + 1
                                  : 0;
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
