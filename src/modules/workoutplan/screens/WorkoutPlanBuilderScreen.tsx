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
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import Card from 'shared/components/Card';
import SelectableField from 'shared/components/SelectableField';
import ToastContainer from 'shared/components/ToastContainer';
import { confirmAsync } from 'shared/utils/confirmAsync';
import {generateId} from 'shared/utils/helpers';
import PlanListHeader from '../components/PlanListHeader';
import PlanListFooter from '../components/PlanListFooter';
import {workoutPlanValidationSchema} from '../utils/validation';
import {
  getSelectedBodyPartIds,
  filterExercisesByBodyParts,
} from '../utils/bodyPartHelpers';
import {
  getGroupLabel as getGroupLabelHelper,
  getGroupLabelById as getGroupLabelByIdHelper,
} from '../utils/groupLabelHelpers';
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
import PlanModals from '../components/PlanModals';
import {useFormInitialValues} from '../hooks/useFormInitialValues';
import {useMetricRegistry} from 'shared/context/MetricRegistry';
import TargetMetricInputGroup from 'shared/components/TargetMetricInputGroup';
import {useWorkoutPlanSummary} from 'shared/hooks/WorkoutPlanSummary';
import ExerciseGroupCard from 'shared/components/ExerciseGroupCard';
import {
  MeasuredDraggableItem,
  Layout,
} from 'shared/dragAndDrop/MeasureDraggableItem';
import type {DragData} from 'shared/dragAndDrop/DraggableItem';
import {usePlanDragAndDrop} from '../hooks/usePlanDragAndDrop';

// TYPE DEFINITIONS
import type { ActiveModal } from '../types/modal.types';

import type {
  ExerciseFormEntry,
  ExerciseGroup,
  FormValues,
  PlanItem,
} from '../types/plan.types';
import {
  getPlanItemsFromForm,
  getNextGlobalOrder,
  updatePreviewOffsets,
} from '../utils/dragAndDrop';

import type {MuscleGroupMeta} from '../types/meta.types';

type RenderItem =
  | {type: 'group'; group: ExerciseGroup}
  | {type: 'exercise'; exercise: ExerciseFormEntry};
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

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

const dragOffsets = useRef<Record<string, Animated.SharedValue<number>>>({});
  const exerciseRefs = useRef<Map<string, {measure: () => void} | null>>(
    new Map(),
  );
  const groupRefs = useRef<Map<string, {measure: () => void} | null>>(
    new Map(),
  );

  const location = useLocation();
  const rawPlan = location.state?.initialPlan;
  const {formInitialValues, groupIdCounterRef} = useFormInitialValues(
    rawPlan,
    workoutMeta,
    createPlanningTargetMetrics,
  );

  const valuesRef = useRef<FormValues>(formInitialValues);

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

  const {
    groupLayouts,
    exerciseLayouts,
    handleDragStart,
    handleDrop: dragAndDropHandleDrop,
  } = usePlanDragAndDrop({
    valuesRef,
    reMeasureAllItems,
    dragOffsets,
    scrollRef,
    isDraggingItem,
    draggedItemOriginalGroupId,
    draggedItemOriginalIndex,
  });


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

  const renderedExerciseIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (formInitialValues && scrollViewReady) {
      setLayoutVersion(prev => prev + 1);
    }
  }, [formInitialValues, scrollViewReady]);

  const isEdit = !!rawPlan && !rawPlan.isFromSession;
  const pushRef = useRef<(item: any) => void>(() => {});

  return (
    <ScreenLayout>
      <Formik<FormValues>
        // enableReinitialize
        initialValues={formInitialValues}
        validationSchema={workoutPlanValidationSchema}
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

          const getGroupLabel = (group: ExerciseGroup) =>
            getGroupLabelHelper(group, getMethodById);

          const getGroupLabelById = (groupId: number) =>
            getGroupLabelByIdHelper(groupId, values.groups, getMethodById);

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
              dragAndDropHandleDrop(
                x,
                y,
                draggedItemData,
                values,
                setFieldValue,
                getMethodById,
                handleDragEnd,
              );
            },
            [values, setFieldValue, getMethodById, handleDragEnd, dragAndDropHandleDrop],
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
                                  label={getGroupLabelHelper(pi.data, getMethodById)}
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
                        ListHeaderComponent={
                          <PlanListHeader
                            isEdit={isEdit}
                            formik={{
                              values,
                              errors,
                              touched,
                              handleChange,
                              handleBlur,
                            } as any}
                            workoutMeta={workoutMeta}
                            setActiveModal={setActiveModal}
                            groupIdCounterRef={groupIdCounterRef}
                            setStagedGroupId={setStagedGroupId}
                            reorderMode={reorderMode}
                            setReorderMode={setReorderMode}
                          />
                        }
                        ListFooterComponent={
                          <PlanListFooter
                            isEdit={isEdit}
                            onSubmit={handleSubmit as any}
                            setActiveModal={setActiveModal}
                          />
                        }
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
                                  label={getGroupLabelHelper(item.group, getMethodById)}
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
                                        <PlanModals
                      activeModal={activeModal}
                      setActiveModal={setActiveModal}
                      values={values}
                      setFieldValue={setFieldValue}
                      workoutMeta={workoutMeta}
                      refetch={refetch}
                      selectedExerciseIndex={selectedExerciseIndex}
                      setSelectedExerciseIndex={setSelectedExerciseIndex}
                      filteredExercises={filteredExercises}
                      pushRef={pushRef}
                      stagedGroupId={stagedGroupId}
                      setStagedGroupId={setStagedGroupId}
                      createPlanningTargetMetrics={createPlanningTargetMetrics}
                    />
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
