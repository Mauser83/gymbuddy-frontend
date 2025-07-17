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
import {
  MeasuredDraggableItem,
  Layout,
} from 'shared/dragAndDrop/MeasureDraggableItem';
import type {DragData} from 'shared/dragAndDrop/DraggableItem';

// TYPE DEFINITIONS
type ActiveModal =
  | null
  | 'trainingGoalPicker'
  | 'difficultyPicker'
  | 'muscleGroupPicker'
  | 'selectExercise'
  | 'trainingMethodPicker'
  | 'groupMethodPicker';

import type {
  ExerciseFormEntry,
  ExerciseGroup,
  FormValues,
  PlanItem,
} from '../types/plan.types';
import {
  getPlanItemsFromForm,
  getNextGlobalOrder,
  isPointInLayout,
  updateExerciseGroup,
  reorderExercises,
  reorderPlanItems,
  calculateDropTarget,
  updatePreviewOffsets,
} from '../utils/dragAndDrop';

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

          const handleDragMove = useWorkletCallback(
            (x: number, y: number, data: DragData) => {
              runOnJS(updatePreviewOffsets)(
                x,
                y,
                data,
                valuesRef.current,
                groupLayouts.current,
                exerciseLayouts.current,
                dragOffsets.current,
                draggedItemOriginalGroupId.value,
              );
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
                          getMethodById,
                        );
                        if (res) {
                          currentVals = {
                            ...currentVals,
                            exercises: res.exercises,
                            groups: res.groups,
                          };
                          setFieldValue('exercises', res.exercises);
                          setFieldValue('groups', res.groups);
                        }
                        const dropInfo = calculateDropTarget(
                          x,
                          y,
                          draggedItemData,
                          currentVals,
                          groupLayouts.current,
                          exerciseLayouts.current,
                        );
                        if (dropInfo) {
                          const planResInit = reorderPlanItems(
                            draggedItemData,
                            dropInfo.target,
                            dropInfo.position,
                            currentVals,
                          );
                          setFieldValue('exercises', planResInit.exercises);
                          setFieldValue('groups', planResInit.groups);
                          currentVals = {
                            ...currentVals,
                            exercises: planResInit.exercises,
                            groups: planResInit.groups,
                          };
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
                  groupLayouts.current,
                  exerciseLayouts.current,
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
                      const reorderRes = reorderExercises(
                        draggedItemData.id,
                        dropInfo.target.id,
                        dropInfo.position,
                        currentVals.exercises,
                        currentVals.groups,
                      );
                      setFieldValue('exercises', reorderRes.exercises);
                      setFieldValue('groups', reorderRes.groups);
                      currentVals = {
                        ...currentVals,
                        exercises: reorderRes.exercises,
                        groups: reorderRes.groups,
                      };
                    } else {
                      const planRes = reorderPlanItems(
                        draggedItemData,
                        dropInfo.target,
                        dropInfo.position,
                        currentVals,
                      );
                      setFieldValue('exercises', planRes.exercises);
                      setFieldValue('groups', planRes.groups);
                      currentVals = {
                        ...currentVals,
                        exercises: planRes.exercises,
                        groups: planRes.groups,
                      };
                    }
                  } else {
                    const planRes2 = reorderPlanItems(
                      draggedItemData,
                      dropInfo.target,
                      dropInfo.position,
                      currentVals,
                    );
                    setFieldValue('exercises', planRes2.exercises);
                    setFieldValue('groups', planRes2.groups);
                    currentVals = {
                      ...currentVals,
                      exercises: planRes2.exercises,
                      groups: planRes2.groups,
                    };
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
                    getMethodById,
                  );
                  if (res) {
                    currentVals = {
                      ...currentVals,
                      exercises: res.exercises,
                      groups: res.groups,
                    };
                    setFieldValue('exercises', res.exercises);
                    setFieldValue('groups', res.groups);
                  }
                  const dropInfo = calculateDropTarget(
                    x,
                    y,
                    draggedItemData,
                    currentVals,
                    groupLayouts.current,
                    exerciseLayouts.current,
                  );
                  if (dropInfo) {
                    const planRes3 = reorderPlanItems(
                      draggedItemData,
                      dropInfo.target,
                      dropInfo.position,
                      currentVals,
                    );
                    setFieldValue('exercises', planRes3.exercises);
                    setFieldValue('groups', planRes3.groups);
                    currentVals = {
                      ...currentVals,
                      exercises: planRes3.exercises,
                      groups: planRes3.groups,
                    };
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
