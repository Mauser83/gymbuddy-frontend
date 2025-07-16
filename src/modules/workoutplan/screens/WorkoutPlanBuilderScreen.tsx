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
  useDerivedValue,
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
import {MeasuredDraggableItem} from 'shared/dragAndDrop/MeasureDraggableItem';

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
  onDragStart?: (data: DragData) => void;
  onDragEnd?: () => void;
  onDragMove?: (x: number, y: number, data: DragData) => void;
  isDraggingShared: Animated.SharedValue<boolean>;
  draggedItemId: Animated.SharedValue<string | null>;
  draggedItemType: Animated.SharedValue<'exercise' | 'group' | null>;
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

const HEADER_HEIGHT_OFFSET = 61;
const SCROLL_THRESHOLD = 80; // Pixels from screen edges to start scrolling
const SCROLL_SPEED = 10; // Pixels per frame scroll speed
// Threshold for triggering a drop in the gap between items earlier
// Higher values widen the drop zone between a group and the following exercise
const GAP_TRIGGER_THRESHOLD = 0.5;
// Minimum visual gap after a group to make dropping easier
const MIN_DROP_GAP_PX = 30;

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
  const draggedItemId = useSharedValue<string | null>(null);
  const draggedItemType = useSharedValue<'exercise' | 'group' | null>(null);
  const draggedItemOriginalGroupId = useSharedValue<number | null>(null);
  const draggedItemOriginalIndex = useSharedValue<number | null>(null);

  const reMeasureAllItems = useCallback(() => {
    exerciseRefs.current.forEach(ref => ref?.measure());
    groupRefs.current.forEach(ref => ref?.measure());
  }, []);

  const handleDragStart = (draggedData: DragData) => {
    // Determine original position for the dragged item
    if (draggedData.type === 'exercise') {
      const exercise = valuesRef.current.exercises.find(
        ex => ex.instanceId === draggedData.id,
      );
      if (exercise) {
        draggedItemOriginalGroupId.value = exercise.groupId ?? null;
        const originalList =
          exercise.groupId != null
            ? valuesRef.current.exercises
                .filter(ex => ex.groupId === exercise.groupId)
                .sort((a, b) => a.order - b.order)
            : valuesRef.current.exercises
                .filter(ex => ex.groupId == null)
                .sort((a, b) => a.order - b.order);
        draggedItemOriginalIndex.value = originalList.findIndex(
          item => item.instanceId === draggedData.id,
        );
      }
    } else if (draggedData.type === 'group') {
      const group = valuesRef.current.groups.find(
        g => String(g.id) === draggedData.id,
      );
      if (group) {
        draggedItemOriginalGroupId.value = group.id;
        const originalList = getPlanItemsFromForm(valuesRef.current)
          .filter(item => item.type === 'group')
          .map(item => item.data);
        draggedItemOriginalIndex.value = originalList.findIndex(
          item => String(item.id) === draggedData.id,
        );
      }
    }

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
    draggedItemOriginalGroupId.value = null;
    draggedItemOriginalIndex.value = null;
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

  const valuesRef = useRef<FormValues>(formInitialValues);

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
            layout: Layout, // The layout object passed to the function
          ) => {
            return (
              pointX >= layout.x &&
              pointX <= layout.x + layout.width &&
              pointY >= layout.y &&
              pointY <= layout.y + layout.height
            );
          };

          const updateExerciseGroup = (
            instanceId: string,
            groupId: number | null,
            currentExercises: ExerciseFormEntry[],
            currentGroups: ExerciseGroup[],
            setFieldValueFn: (field: string, value: any) => void,
          ):
            | {exercises: ExerciseFormEntry[]; groups: ExerciseGroup[]}
            | undefined => {
            const exerciseIndex = currentExercises.findIndex(
              ex => ex.instanceId === instanceId,
            );
            if (exerciseIndex === -1) return;

            const updatedExercises = [...currentExercises];
            const updatedGroups = [...currentGroups];

            if (groupId !== null) {
              // Logic for ADDING an exercise TO a group
              const group = updatedGroups.find(g => g.id === groupId);
              if (!group) return;

              const method = getMethodById(group.trainingMethodId);
              const max = method?.maxGroupSize;
              const exercisesInGroup = updatedExercises.filter(
                e => e.groupId === groupId,
              );

              if (max != null && exercisesInGroup.length >= max) {
                Alert.alert(
                  'Group Limit Reached',
                  `You can only add ${max} exercises to this group.`,
                );
                return;
              }

              const newTrainingMethodId = group.trainingMethodId ?? null;

              // Place the new item at the top of the group's order
              updatedExercises[exerciseIndex] = {
                ...updatedExercises[exerciseIndex],
                groupId,
                trainingMethodId: newTrainingMethodId,
                order: group.order + 0.1, // Fractional order to place it first
              };

              // Re-order existing items within the group to follow the new one
              exercisesInGroup
                .sort((a, b) => a.order - b.order)
                .forEach((ex, idx) => {
                  const originalExIndex = updatedExercises.findIndex(
                    e => e.instanceId === ex.instanceId,
                  );
                  if (originalExIndex !== -1) {
                    updatedExercises[originalExIndex].order =
                      group.order + 0.2 + idx * 0.1;
                  }
                });
            } else {
              // Logic for UNGROUPING an exercise
              const oldGroupId = updatedExercises[exerciseIndex].groupId;
              if (oldGroupId === null) return; // Already ungrouped

              updatedExercises[exerciseIndex] = {
                ...updatedExercises[exerciseIndex],
                groupId: null,
                trainingMethodId: null,
                order: getNextGlobalOrder(updatedExercises, updatedGroups), // Move to end of main list
              };
            }

            const {exercises: finalExercises, groups: finalGroups} =
              reindexAllOrders(updatedExercises, updatedGroups);

            setFieldValueFn('groups', finalGroups);
            setFieldValueFn('exercises', finalExercises);
            setLayoutVersion(prev => prev + 1);

            return {exercises: finalExercises, groups: finalGroups};
          };

          const reorderExercises = (
            draggedId: string,
            targetId: string,
            position: 'before' | 'after',
            currentExercises: ExerciseFormEntry[],
            currentGroups: ExerciseGroup[],
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

            let fromIdx = containerExercises.findIndex(
              ex => ex.instanceId === draggedId,
            );
            let targetIdx = containerExercises.findIndex(
              ex => ex.instanceId === targetId,
            );
            if (fromIdx === -1 || targetIdx === -1) return;

            const [moved] = containerExercises.splice(fromIdx, 1);

            if (fromIdx < targetIdx) {
              targetIdx--;
            }

            let insertIdx = targetIdx;
            if (position === 'after') {
              insertIdx = targetIdx + 1;
            }

            containerExercises.splice(insertIdx, 0, moved);

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
              reindexAllOrders(updatedExercises, currentGroups);

            setFieldValueFn('exercises', finalExercises);
            setFieldValueFn('groups', finalGroups);
            setLayoutVersion(prev => prev + 1);
          };

          // Moved reorderPlanItems definition before handleDrop
          const reorderPlanItems = useCallback(
            (
              dragged: DragData,
              target: DragData,
              position: 'before' | 'after', // The new, crucial parameter
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
              let targetIndex = items.findIndex(i => {
                if (i.type !== target.type) return false;
                return i.type === 'exercise'
                  ? i.data.instanceId === target.id
                  : String(i.data.id) === target.id;
              });

              if (draggedIndex === -1 || targetIndex === -1) return;

              const newItems = [...items];
              const [moved] = newItems.splice(draggedIndex, 1);

              // If the dragged item was before the target, the target's index is now one less.
              if (draggedIndex < targetIndex) {
                targetIndex--;
              }

              // Determine the final insertion index based on the drop position
              let finalIndex = targetIndex;
              if (position === 'after') {
                finalIndex = targetIndex + 1;
              }

              newItems.splice(finalIndex, 0, moved);

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
            },
            [], // Dependencies: None, as it uses arguments for current state
          );

                    /**
           * Build the array of items representing the current drag container.
           * This logic is shared between preview offset updates and drop target
           * calculation so the ordering and contents remain consistent.
           *
           * @param draggedItemData Item being dragged
           * @param currentValues   Current form values
           * @param pointerY        Current pointer Y position (optional)
           * @param includePlaceholder If true, inject the dragged item as a
           *                           placeholder when it isn't already in the
           *                           container. This is used for the preview.
           * @param originalGroupId Original group id for the dragged item. Used
           *                        only when includePlaceholder is true to
           *                        compute drag direction.
           */
          const buildContainerItemsForDrag = (
            draggedItemData: DragData,
            currentValues: FormValues,
            pointerY: number | null,
            includePlaceholder: boolean,
            originalGroupId: number | null,
          ): {
            items: {id: string; layout: Layout; type: 'group' | 'exercise'}[];
            fromIdx: number;
            wasOriginallyOutside: boolean;
            originalDragDirection: 'up' | 'down' | null;
          } | null => {
            const draggedKey =
              draggedItemData.type === 'group'
                ? String(draggedItemData.id)
                : draggedItemData.id;

            const containerItems: {
              id: string;
              layout: Layout;
              type: 'group' | 'exercise';
            }[] = [];

            const draggedItem = currentValues.exercises.find(
              e => e.instanceId === draggedItemData.id,
            );

            const isPointerOverAnyGroup =
              pointerY != null
                ? Object.values(groupLayouts.current).some(
                    l => pointerY >= l.y && pointerY <= l.y + l.height,
                  )
                : false;

            const treatAsTopLevelDrag =
              draggedItemData.type === 'group' ||
              (draggedItemData.type === 'exercise' &&
                (pointerY == null
                  ? draggedItem?.groupId == null
                  : draggedItem?.groupId == null || !isPointerOverAnyGroup));

            if (treatAsTopLevelDrag) {
              for (const id in exerciseLayouts.current) {
                const ex = currentValues.exercises.find(
                  e => e.instanceId === id,
                );
                                if (ex && ex.groupId == null && exerciseLayouts.current[id]) {
                  containerItems.push({
                    id,
                    layout: exerciseLayouts.current[id],
                    type: 'exercise',
                  });
                }
              }
              for (const id in groupLayouts.current) {
                const groupFound = currentValues.groups.find(
                  g => String(g.id) === id,
                );
                if (groupFound && groupLayouts.current[id]) {
                  containerItems.push({
                    id: String(id),
                    layout: groupLayouts.current[id],
                    type: 'group',
                  });
                }
              }
            } else {
              if (!draggedItem) return null;
              const groupId = draggedItem.groupId;
              if (groupId != null) {
                const groupLayout = groupLayouts.current[groupId];
                if (groupLayout) {
                  containerItems.push({
                    id: String(groupId),
                    layout: groupLayout,
                    type: 'group',
                  });
                }
                const exs = currentValues.exercises
                  .filter(ex => ex.groupId === groupId)
                  .sort((a, b) => a.order - b.order);
                exs.forEach(ex => {
                  const layout = exerciseLayouts.current[ex.instanceId];
                  if (layout)
                    containerItems.push({
                      id: ex.instanceId,
                      layout,
                      type: 'exercise',
                    });
                });
              }
            }

            containerItems.sort((a, b) => a.layout.y - b.layout.y);

            let fromIdx = containerItems.findIndex(it => it.id === draggedKey);
            let wasOriginallyOutside = false;
            let originalDragDirection: 'up' | 'down' | null = null;

            if (
              includePlaceholder &&
              fromIdx === -1 &&
              pointerY != null &&
              draggedItemData.type === 'exercise'
            ) {
              const baseLayout = exerciseLayouts.current[draggedKey];
              if (baseLayout) {
                wasOriginallyOutside = true;

                if (originalGroupId != null) {
                  const originalLayout = groupLayouts.current[originalGroupId];
                  if (originalLayout) {
                    if (pointerY < originalLayout.y) {
                      originalDragDirection = 'up';
                    } else if (pointerY > originalLayout.y + originalLayout.height) {
                      originalDragDirection = 'down';
                    }
                  }
                }

                const newItem = {
                  id: draggedKey,
                  layout: {...baseLayout, y: pointerY},
                  type: 'exercise' as const,
                };

                let inserted = false;
                for (let i = 0; i < containerItems.length; i++) {
                  if (pointerY < containerItems[i].layout.y) {
                    containerItems.splice(i, 0, newItem);
                    inserted = true;
                    break;
                  }
                }
                if (!inserted) containerItems.push(newItem);

                containerItems.sort((a, b) => a.layout.y - b.layout.y);
                fromIdx = containerItems.findIndex(it => it.id === draggedKey);
              }
            }

            return {items: containerItems, fromIdx, wasOriginallyOutside, originalDragDirection};
          };

          const calculateDropTarget = (
            x: number,
            y: number,
            draggedItemData: DragData,
            currentValues: FormValues,
          ): {target: DragData; position: 'before' | 'after'} | null => {
            const result = buildContainerItemsForDrag(
              draggedItemData,
              currentValues,
              null,
              false,
              null,
            );
            if (!result) return null;
            const {items: containerItems, fromIdx} = result;
            const draggedKey =
              draggedItemData.type === 'group'
                ? String(draggedItemData.id)
                : draggedItemData.id;

            let finalTargetIdx = fromIdx;
            let finalPreviewPosition: 'before' | 'after' = 'after';

            const GROUP_SHRINK_VERTICAL_OFFSET = 30;

            for (let i = 0; i < containerItems.length; i++) {
              const item = containerItems[i];
                            const originalItemLayout = {...item.layout};
              let currentItemLayout = {...item.layout};

              
              // If the previous item is a group, treat the top part of the next
              // item as a drop zone "after" the group. This must be checked
              // before normal overlap logic so it takes precedence.
              if (
                i < containerItems.length - 1 &&
                item.type === 'group'
              ) {
                const nextItem = containerItems[i + 1];
                const nextTop = nextItem.layout.y;
                if (y >= nextTop && y < nextTop + MIN_DROP_GAP_PX) {
                  finalTargetIdx = i;
                  finalPreviewPosition = 'after';
                  break;
                }
              }

              if (item.type === 'group') {
                currentItemLayout.y += GROUP_SHRINK_VERTICAL_OFFSET;
                currentItemLayout.height -= GROUP_SHRINK_VERTICAL_OFFSET * 3;
                console.log(currentItemLayout.height)
                if (currentItemLayout.height < 0) currentItemLayout.height = 0;
              }

              if (item.id === draggedKey) continue;

              const itemMidpointY =
                currentItemLayout.y + currentItemLayout.height / 2;
              const beforeThreshold =
                currentItemLayout.y + currentItemLayout.height * 0.2;
              const afterThreshold =
                currentItemLayout.y + currentItemLayout.height * 0.8;

              if (
                y >= currentItemLayout.y &&
                y <= currentItemLayout.y + currentItemLayout.height
              ) {
                finalTargetIdx = i;
                if (y < beforeThreshold) {
                  finalPreviewPosition = 'before';
                } else if (y > afterThreshold) {
                  finalPreviewPosition = 'after';
                } else {
                  finalPreviewPosition = y < itemMidpointY ? 'before' : 'after';
                }
                break;
              } else if (i < containerItems.length - 1) {
                const nextItem = containerItems[i + 1];
                                const originalNextItemLayout = {...nextItem.layout};
                let nextItemLayout = {...nextItem.layout};
                if (nextItem.type === 'group') {
                  nextItemLayout.y += GROUP_SHRINK_VERTICAL_OFFSET;
                  nextItemLayout.height -= GROUP_SHRINK_VERTICAL_OFFSET * 2;
                  if (nextItemLayout.height < 0) nextItemLayout.height = 0;
                }

                const gapStart =
                  originalItemLayout.y + originalItemLayout.height;
                let gapEnd = nextItemLayout.y;
                if (
                  item.type === 'group' &&
                  gapEnd - gapStart < MIN_DROP_GAP_PX
                ) {
                  gapEnd = gapStart + MIN_DROP_GAP_PX;
                }
                                const earlyTriggerThreshold = GAP_TRIGGER_THRESHOLD;
                const triggerPointInGap =
                  gapStart + (gapEnd - gapStart) * earlyTriggerThreshold;

                                if (item.type === 'group') {
                  if (
                    y >= originalNextItemLayout.y &&
                    y < originalNextItemLayout.y + MIN_DROP_GAP_PX
                  ) {
                    finalTargetIdx = i;
                    finalPreviewPosition = 'after';
                    break;
                  }
                }

                if (y > gapStart && y < gapEnd) {
                  if (y < triggerPointInGap) {
                    finalTargetIdx = i;
                    finalPreviewPosition = 'after';
                    break;
                  } else {
                    finalTargetIdx = i + 1;
                    finalPreviewPosition = 'before';
                    break;
                  }
                }
              } else if (
                i === containerItems.length - 1 &&
                y > currentItemLayout.y + currentItemLayout.height
              ) {
                finalTargetIdx = containerItems.length - 1;
                finalPreviewPosition = 'after';
                break;
              }
            }

            const targetItem = containerItems[finalTargetIdx];
            if (!targetItem || targetItem.id === draggedKey) return null;

            return {
              target: {type: targetItem.type, id: targetItem.id},
              position: finalPreviewPosition,
            };
          };

          const updatePreviewOffsets = useCallback(
            (x: number, y: number, draggedItemData: DragData) => {
              const result = buildContainerItemsForDrag(
                draggedItemData,
                valuesRef.current,
                y,
                true,
                draggedItemOriginalGroupId.value,
              );
              if (!result) return;
              const {
                items: containerItems,
                fromIdx,
                wasOriginallyOutside,
                originalDragDirection,
              } = result;
                            const draggedKey =
                draggedItemData.type === 'group'
                  ? String(draggedItemData.id)
                  : draggedItemData.id;

              // Reset all offsets before applying new ones to ensure a clean state
              containerItems.forEach(item => {
                if (dragOffsets.current[item.id]) {
                  dragOffsets.current[item.id].value = 0;
                }
              });

              let finalTargetIdx = fromIdx; // Default to current position if no better target found
              let finalPreviewPosition: 'before' | 'after' = 'before'; // Default for placeholder

              // Define the shrink amount for groups
              const GROUP_SHRINK_VERTICAL_OFFSET = 30; // Adjust this value as needed

              // Find the target index and preview position
              for (let i = 0; i < containerItems.length; i++) {
                const item = containerItems[i];
                                const originalItemLayout = {...item.layout};
                let currentItemLayout = {...item.layout}; // Create a mutable copy of the layout

                // If this item is a group, and the pointer is within the top
                // MIN_DROP_GAP_PX of the next item, treat it as a drop after
                // this group. This precedes the regular overlap check so that
                // dragging directly over the next item still counts as dropping
                // after the group.
                if (
                  i < containerItems.length - 1 &&
                  item.type === 'group'
                ) {
                  const nextItem = containerItems[i + 1];
                  const nextTop = nextItem.layout.y;
                  if (y >= nextTop && y < nextTop + MIN_DROP_GAP_PX) {
                    finalTargetIdx = i;
                    finalPreviewPosition = 'after';
                    break;
                  }
                }

                // Apply shrinking for group items only to modify their effective drag detection area
                if (item.type === 'group') {
                  currentItemLayout.y += GROUP_SHRINK_VERTICAL_OFFSET;
                  currentItemLayout.height -=
                    GROUP_SHRINK_VERTICAL_OFFSET * 2.2; // Adjust multiplier if needed
                  if (currentItemLayout.height < 0)
                    currentItemLayout.height = 0; // Ensure height doesn't go negative
                }

                // Skip the dragged item itself (if it's in the current containerItems, which it won't be if fromIdx === -1 initially)
                // if (item.id === draggedKey) continue;

                // Special handling for dropping an exercise onto a group (no shuffling of other items)
                // This logic prevents reordering *within* the top-level list if an exercise is being dropped *into* a group.
                if (item.type === 'group') {
                  if (
                    draggedItemData.type === 'exercise' &&
                    y >= item.layout.y &&
                    y <= item.layout.y + item.layout.height
                  ) {
                    return;
                  }
                }

                const itemMidpointY =
                  currentItemLayout.y + currentItemLayout.height / 2;
                const beforeThreshold =
                  currentItemLayout.y + currentItemLayout.height * 0.2;
                const afterThreshold =
                  currentItemLayout.y + currentItemLayout.height * 0.8;

                // Case 1: Dragging over any item (exercise or group) using the *adjusted* layout
                if (
                  y >= currentItemLayout.y &&
                  y <= currentItemLayout.y + currentItemLayout.height
                ) {
                  finalTargetIdx = i;
                  if (y < beforeThreshold) {
                    finalPreviewPosition = 'before';
                  } else if (y > afterThreshold) {
                    finalPreviewPosition = 'after';
                  } else {
                    finalPreviewPosition =
                      y < itemMidpointY ? 'before' : 'after';
                  }
                  break;
                }
                // Case 2: Dragging in a gap between current item and the next item
                else if (i < containerItems.length - 1) {
                  const nextItem = containerItems[i + 1];
                                    const originalNextItemLayout = {...nextItem.layout};

                  let nextItemLayout = {...nextItem.layout};

                  if (nextItem.type === 'group') {
                    nextItemLayout.y += GROUP_SHRINK_VERTICAL_OFFSET;
                    nextItemLayout.height -= GROUP_SHRINK_VERTICAL_OFFSET * 2;
                    if (nextItemLayout.height < 0) nextItemLayout.height = 0;
                  }

                  const gapStart =
                    originalItemLayout.y + originalItemLayout.height;
                  let gapEnd = nextItemLayout.y;
                  if (
                    item.type === 'group' &&
                    gapEnd - gapStart < MIN_DROP_GAP_PX
                  ) {
                    gapEnd = gapStart + MIN_DROP_GAP_PX;
                  }

                  // Define a threshold for the "early" trigger within the gap
                  const earlyTriggerThreshold = GAP_TRIGGER_THRESHOLD; // e.g., trigger when 50% into the gap
                  const triggerPointInGap =
                    gapStart + (gapEnd - gapStart) * earlyTriggerThreshold;

                                    if (item.type === 'group') {
                    if (
                      y >= originalNextItemLayout.y &&
                      y < originalNextItemLayout.y + MIN_DROP_GAP_PX
                    ) {
                      finalTargetIdx = i;
                      finalPreviewPosition = 'after';
                      break;
                    }
                  }

                  if (y > gapStart && y < gapEnd) {
                    if (y < triggerPointInGap) {
                      // If dragging in the early part of the gap, consider it 'after' the current item
                      finalTargetIdx = i;
                      finalPreviewPosition = 'after';
                      break;
                    } else {
                      // If dragging past the early trigger point in the gap, consider it 'before' the next item
                      finalTargetIdx = i + 1;
                      finalPreviewPosition = 'before';
                      break;
                    }
                  }
                }
                // Case 3: Dragging past the last item (if the last item is not the dragged one)
                else if (
                  i === containerItems.length - 1 &&
                  y > currentItemLayout.y + currentItemLayout.height
                ) {
                  finalTargetIdx = containerItems.length; // Insert at the very end
                  finalPreviewPosition = 'after';
                  break;
                }
              }

              // Calculate the effective insertion index for offset application
              let effectiveInsertionIndex = finalTargetIdx;
              if (finalPreviewPosition === 'after') {
                effectiveInsertionIndex = finalTargetIdx + 1;
              }

              // Clamp effectiveInsertionIndex to valid bounds (0 to containerItems.length)
              effectiveInsertionIndex = Math.max(
                0,
                Math.min(effectiveInsertionIndex, containerItems.length),
              );

              // Apply offsets for placeholder shuffling
              const baseHeight =
                exerciseLayouts.current[draggedKey]?.height ?? 82;
              const draggedItemHeight =
                fromIdx >= 0
                  ? containerItems[fromIdx].layout.height
                  : baseHeight;
              if (wasOriginallyOutside) {
                if (originalDragDirection === 'down') {
                  // For items new to this container, we just shift everything *after or at* the insertion point down.
                  for (let i = 0; i < containerItems.length; i++) {
                    const item = containerItems[i];
                    if (item.id === draggedKey) {
                      continue; // Ensure dragged item itself is never offset
                    }
                    if (i >= effectiveInsertionIndex) {
                      if (dragOffsets.current[item.id]) {
                        dragOffsets.current[item.id].value = draggedItemHeight;
                      }
                    }
                  }
                } else if (originalDragDirection === 'up') {
                  // For items new to this container, we just shift everything *after or at* the insertion point down.
                  for (let i = 0; i < containerItems.length; i++) {
                    const item = containerItems[i];

                    if (String(item.id) === String(draggedKey)) {
                      dragOffsets.current[draggedKey].value =
                        -draggedItemHeight;
                      continue; // Skip offset for dragged item
                    }

                    if (i >= effectiveInsertionIndex) {
                      if (
                        item.id !== draggedKey &&
                        dragOffsets.current[item.id]
                      ) {
                        dragOffsets.current[item.id].value = draggedItemHeight;
                      }
                    }
                  }
                }
              } else {
                // Item is moving *within* the same container
                if (effectiveInsertionIndex < fromIdx) {
                  // Items between the new position (inclusive) and the old position (exclusive) shift down
                  for (let i = 0; i < containerItems.length; i++) {
                    const item = containerItems[i];
                    if (item.id === draggedKey) {
                      continue;
                    }
                    if (i >= effectiveInsertionIndex && i < fromIdx) {
                      if (dragOffsets.current[item.id]) {
                        dragOffsets.current[item.id].value = draggedItemHeight;
                      }
                    }
                  }
                } else if (effectiveInsertionIndex > fromIdx) {
                  // Items between the old position (exclusive) and the new position (exclusive) shift up
                  for (let i = 0; i < containerItems.length; i++) {
                    const item = containerItems[i];
                    if (item.id === draggedKey) {
                      continue;
                    }
                    if (i > fromIdx && i < effectiveInsertionIndex) {
                      if (dragOffsets.current[item.id]) {
                        dragOffsets.current[item.id].value = -draggedItemHeight;
                      }
                    }
                  }
                }
                if (dragOffsets.current[draggedKey]) {
                  dragOffsets.current[draggedKey].value = 0;
                }
              }
            },
            [], // Dependencies: None, as it uses valuesRef.current
          );

          const handleDragMove = useWorkletCallback(
            (x: number, y: number, data: DragData) => {
              runOnJS(updatePreviewOffsets)(x, y, data);
            },
            [],
          );

          const handleDrop = useCallback(
            (x: number, y: number, draggedItemData: DragData) => {
              let droppedHandled = false;
              let currentVals: FormValues = values;

              // --- Step 1: Check for dropping an exercise into an existing group ---
              // This section is only relevant if the dragged item is an exercise.
              if (draggedItemData.type === 'exercise') {
                const draggedItem = values.exercises.find(
                  ex => ex.instanceId === draggedItemData.id,
                );
                if (draggedItem) {
                  for (const groupIdStr in groupLayouts.current) {
                    const originalLayout = groupLayouts.current[groupIdStr];
                    const offset = dragOffsets.current[groupIdStr]?.value ?? 0;
                    const adjustedLayout = {
                      ...originalLayout,
                      y: originalLayout.y + offset,
                    };
                    // Check if the drop point is within the bounds of a group
                    if (isPointInLayout(x, y, adjustedLayout)) {
                      const targetGroupId = parseInt(groupIdStr, 10);
                      // Only update if the exercise is not already in this group
                      if (draggedItem.groupId !== targetGroupId) {
                        const res = updateExerciseGroup(
                          draggedItemData.id,
                          targetGroupId,
                          currentVals.exercises,
                          currentVals.groups,
                          setFieldValue,
                        );
                        if (res) {
                          currentVals = {
                            ...currentVals,
                            exercises: res.exercises,
                            groups: res.groups,
                          };
                        }
                        const dropInfo = calculateDropTarget(
                          x,
                          y,
                          draggedItemData,
                          currentVals,
                        );
                        if (dropInfo) {
                          reorderPlanItems(
                            draggedItemData,
                            dropInfo.target,
                            dropInfo.position,
                            currentVals,
                            setFieldValue,
                          );
                        }
                        droppedHandled = true;
                        break; // Group found and handled, exit loop
                      }
                    }
                  }
                }
              }

              // --- Step 2: Reorder top-level items (exercises or groups) ---
              // This section runs if the item was not dropped into an existing group.
              if (!droppedHandled) {
                const dropInfo = calculateDropTarget(
                  x,
                  y,
                  draggedItemData,
                  currentVals,
                );
                if (dropInfo) {
                  if (
                    draggedItemData.type === 'exercise' &&
                    dropInfo.target.type === 'exercise'
                  ) {
                    const draggedItem = currentVals.exercises.find(
                      ex => ex.instanceId === draggedItemData.id,
                    );
                    const targetItem = currentVals.exercises.find(
                      ex => ex.instanceId === dropInfo.target.id,
                    );
                    if (
                      draggedItem &&
                      targetItem &&
                      draggedItem.groupId === targetItem.groupId &&
                      draggedItem.groupId !== null
                    ) {
                      reorderExercises(
                        draggedItemData.id,
                        dropInfo.target.id,
                        dropInfo.position,
                        currentVals.exercises,
                        currentVals.groups,
                        setFieldValue,
                      );
                    } else {
                      reorderPlanItems(
                        draggedItemData,
                        dropInfo.target,
                        dropInfo.position,
                        currentVals,
                        setFieldValue,
                      );
                    }
                  } else {
                    reorderPlanItems(
                      draggedItemData,
                      dropInfo.target,
                      dropInfo.position,
                      currentVals,
                      setFieldValue,
                    );
                  }
                  droppedHandled = true;
                }
              }

              // --- Step 3: Handle dropping a top-level exercise into empty space (out of group) ---
              // This handles cases where an exercise was in a group and is now dropped
              // into a top-level empty space, or if no specific reorder target was found.
              if (!droppedHandled && draggedItemData.type === 'exercise') {
                const draggedItem = currentVals.exercises.find(
                  ex => ex.instanceId === draggedItemData.id,
                );
                if (draggedItem && draggedItem.groupId !== null) {
                  const res = updateExerciseGroup(
                    draggedItemData.id,
                    null, // Set groupId to null to make it a top-level exercise
                    currentVals.exercises,
                    currentVals.groups,
                    setFieldValue,
                  );
                  if (res) {
                    currentVals = {
                      ...currentVals,
                      exercises: res.exercises,
                      groups: res.groups,
                    };
                  }
                  const dropInfo = calculateDropTarget(
                    x,
                    y,
                    draggedItemData,
                    currentVals,
                  );
                  if (dropInfo) {
                    reorderPlanItems(
                      draggedItemData,
                      dropInfo.target,
                      dropInfo.position,
                      currentVals,
                      setFieldValue,
                    );
                  }
                  droppedHandled = true;
                }
              }

              // Always call handleDragEnd to reset drag state and clear offsets
              handleDragEnd();
            },
            [
              setFieldValue,
              handleDragEnd,
              reorderPlanItems,
              calculateDropTarget,
              values.exercises,
              values.groups,
            ],
          );
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
                              <MeasuredDraggableItem
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
                                id={String(pi.data.id)}
                                type="group"
                                onDrop={handleDrop}
                                simultaneousHandlers={scrollRef}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onDragMove={handleDragMove}
                                layoutStore={groupLayouts}
                                offsetStore={dragOffsets}
                                isDraggingShared={isDragging}
                                draggedItemId={draggedItemId}
                                draggedItemType={draggedItemType}
                                pointerPositionY={pointerPositionY}
                                scrollOffset={scrollOffsetY}
                                layoutVersion={layoutVersion}
                                scrollLayoutVersion={scrollLayoutVersion}>
                                <ExerciseGroupCard
                                  label={getGroupLabel(pi.data)}
                                  borderColor={theme.colors.accentStart}
                                  textColor={theme.colors.textPrimary}>
                                  {(() => {
                                    const groupExercises = getGroupedExercises(
                                      pi.data.id,
                                    );
                                    const method = getMethodById(
                                      pi.data.trainingMethodId,
                                    );
                                    const max = method?.maxGroupSize;
                                    const hasSpace =
                                      max == null ||
                                      groupExercises.length < max;
                                    return (
                                      <>
                                        {groupExercises.map(ex => (
                                          <MeasuredDraggableItem
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
                                            id={ex.instanceId}
                                            type="exercise"
                                            onDrop={handleDrop}
                                            simultaneousHandlers={scrollRef}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                            onDragMove={handleDragMove}
                                            layoutStore={exerciseLayouts}
                                            offsetStore={dragOffsets}
                                            isDraggingShared={isDragging}
                                            draggedItemId={draggedItemId}
                                            draggedItemType={draggedItemType}
                                            pointerPositionY={pointerPositionY}
                                            scrollOffset={scrollOffsetY}
                                            layoutVersion={layoutVersion}
                                            scrollLayoutVersion={
                                              scrollLayoutVersion
                                            }>
                                            <View
                                              style={{
                                                marginHorizontal: spacing.md,
                                                marginVertical: spacing.sm,
                                                backgroundColor:
                                                  theme.colors.surface,
                                                padding: spacing.sm,
                                                borderRadius: 6,
                                                borderWidth: 1,
                                                borderColor:
                                                  theme.colors.accentEnd,
                                              }}>
                                              <Text
                                                style={{
                                                  color:
                                                    theme.colors.textPrimary,
                                                  fontWeight: 'bold',
                                                }}>
                                                {ex.exerciseName}
                                              </Text>
                                              <Text
                                                style={{
                                                  color:
                                                    theme.colors.textSecondary,
                                                }}>
                                                {renderSummary(ex)}
                                              </Text>
                                            </View>
                                          </MeasuredDraggableItem>
                                        ))}
                                        {hasSpace && (
                                          <View
                                            style={{
                                              marginVertical: spacing.sm,
                                              padding: spacing.sm,
                                              alignItems: 'center',
                                              borderWidth: 1,
                                              borderStyle: 'dashed',
                                              borderRadius: 6,
                                              borderColor:
                                                theme.colors.accentEnd,
                                              backgroundColor:
                                                theme.colors.surface,
                                            }}>
                                            <Text
                                              style={{
                                                color:
                                                  theme.colors.textSecondary,
                                              }}>
                                              Drag here to insert
                                            </Text>
                                          </View>
                                        )}
                                      </>
                                    );
                                  })()}
                                </ExerciseGroupCard>
                              </MeasuredDraggableItem>
                            ) : (
                              <MeasuredDraggableItem
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
                                id={pi.data.instanceId}
                                type="exercise"
                                onDrop={handleDrop}
                                simultaneousHandlers={scrollRef}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onDragMove={handleDragMove}
                                layoutStore={exerciseLayouts}
                                offsetStore={dragOffsets}
                                isDraggingShared={isDragging}
                                draggedItemId={draggedItemId}
                                draggedItemType={draggedItemType}
                                pointerPositionY={pointerPositionY}
                                scrollOffset={scrollOffsetY}
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
                              </MeasuredDraggableItem>
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
                                  {(() => {
                                    const method = getMethodById(
                                      item.group.trainingMethodId,
                                    );
                                    const max = method?.maxGroupSize;
                                    const hasSpace =
                                      max == null ||
                                      groupExercises.length < max;
                                    return (
                                      <>
                                        {groupExercises.map(exercise => {
                                          const idx =
                                            values.exercises.findIndex(
                                              e =>
                                                e.instanceId ===
                                                exercise.instanceId,
                                            );
                                          const isExpanded =
                                            expandedExerciseIndex === idx;

                                          return (
                                            <View
                                              key={exercise.instanceId}
                                              style={{
                                                marginVertical: spacing.sm,
                                                padding: spacing.sm,
                                                backgroundColor:
                                                  theme.colors.surface,
                                                borderRadius: 6,
                                                borderWidth: 1,
                                                borderColor:
                                                  theme.colors.accentEnd,
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
                                                    justifyContent:
                                                      'space-between',
                                                  }}>
                                                  <Text
                                                    style={{
                                                      color:
                                                        theme.colors
                                                          .textPrimary,
                                                      fontWeight: 'bold',
                                                    }}>
                                                    #{idx + 1}{' '}
                                                    {exercise.exerciseName}
                                                  </Text>
                                                  <FontAwesome
                                                    name={
                                                      isExpanded
                                                        ? 'chevron-up'
                                                        : 'chevron-down'
                                                    }
                                                    style={{
                                                      fontSize: 16,
                                                      color:
                                                        theme.colors
                                                          .accentStart,
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
                                                    exerciseId={
                                                      exercise.exerciseId
                                                    }
                                                    values={
                                                      exercise.targetMetrics
                                                    }
                                                    onChange={(
                                                      metricId,
                                                      field,
                                                      value,
                                                    ) => {
                                                      const updated =
                                                        exercise.targetMetrics.map(
                                                          m =>
                                                            m.metricId ===
                                                            metricId
                                                              ? {
                                                                  ...m,
                                                                  [field]:
                                                                    value,
                                                                }
                                                              : m,
                                                        );
                                                      setFieldValue(
                                                        `exercises[${idx}].targetMetrics`,
                                                        updated,
                                                      );
                                                    }}
                                                    errors={
                                                      (
                                                        errors.exercises?.[
                                                          idx
                                                        ] as any
                                                      )?.targetMetrics
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
                                      </>
                                    );
                                  })()}
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
