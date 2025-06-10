import React, {useState, useRef, useMemo} from 'react';
import {
  View,
  Alert,
  Text,
  TouchableOpacity,
  Pressable,
  Platform,
  FlatList, // Import FlatList
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

// 🧩 Modular modals
import SelectExerciseModal from '../components/SelectExerciseModal';
import TrainingGoalPickerModal from '../components/TrainingGoalPickerModal';
import DifficultyPickerModal from '../components/DifficultyPickerModal';
import MuscleGroupPickerModal from '../components/MuscleGroupPickerModal';
import TrainingMethodPicker from '../components/TrainingMethodPicker';
import {useMetricRegistry} from 'shared/context/MetricRegistry';
import TargetMetricInputGroup from 'shared/components/TargetMetricInputGroup';
import {useWorkoutPlanSummary} from 'shared/hooks/WorkoutPlanSummary';
import DraggableFlatList, {
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import {WebDraggableList} from 'shared/components/WebDraggableList';

type ActiveModal =
  | null
  | 'trainingGoalPicker'
  | 'difficultyPicker'
  | 'muscleGroupPicker'
  | 'selectExercise'
  | 'trainingMethodPicker';

type ExerciseFormEntry = {
  instanceId: string; // <-- Add this line
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
};

type FormValues = {
  name: string;
  trainingGoalId: number;
  intensityPresetId: number;
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  muscleGroupIds: number[];
  exercises: ExerciseFormEntry[];
};

type MuscleGroupMeta = {
  id: number;
  name: string;
  bodyParts: {
    id: number;
    name: string;
  }[];
};

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

export default function WorkoutPlanBuilderScreen() {
  const {theme} = useTheme();
  const navigate = useNavigate();
  const {data: workoutMeta, refetch} = useQuery(GET_WORKOUT_PLAN_META);
  const [createWorkoutPlan] = useMutation(CREATE_WORKOUT_PLAN);
  const [updateWorkoutPlan] = useMutation(UPDATE_WORKOUT_PLAN);

  const {createPlanningTargetMetrics} = useMetricRegistry();

  const {data: exerciseData, loading: loadingExercises} =
    useQuery(GET_EXERCISES_BASIC);

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const [reorderMode, setReorderMode] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<
    number | null
  >(null);
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState<
    number | null
  >(null);

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  function convertPlanToInitialValues(plan: any): FormValues {
    const isFromSession = plan.isFromSession;

    if (isFromSession) {
      return {
        name: plan.name,
        trainingGoalId: plan.trainingGoal?.id,
        intensityPresetId: plan.intensityPreset?.id ?? undefined,
        experienceLevel: plan.intensityPreset?.experienceLevel ?? undefined,
        muscleGroupIds: [],
        exercises: plan.exercises.map((ex: any) => ({
          instanceId: generateUniqueId(), // <-- Add this
          exerciseId: ex.exerciseId ?? ex.exercise.id,
          exerciseName: ex.exerciseName ?? ex.exercise.name,
          targetSets: ex.targetSets,
          targetMetrics: ex.targetMetrics?.length
            ? ex.targetMetrics
            : createPlanningTargetMetrics(ex.exerciseId ?? ex.exercise.id),
          trainingMethodId:
            ex.trainingMethodId ?? ex.trainingMethod?.id ?? null,
          isWarmup: ex.isWarmup ?? false,
        })),
      };
    }

    return {
      name: plan.name,
      trainingGoalId: plan.trainingGoal?.id,
      intensityPresetId: plan.intensityPreset?.id ?? undefined,
      experienceLevel: plan.intensityPreset?.experienceLevel ?? undefined,
      muscleGroupIds: plan.muscleGroups.map((mg: any) => mg.id),
      exercises: plan.exercises.map((ex: any) => ({
        instanceId: generateUniqueId(), // <-- Add this
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        targetSets: ex.targetSets,
        targetMetrics:
          ex.targetMetrics ?? createPlanningTargetMetrics(ex.exerciseId),
        trainingMethodId: ex.trainingMethodId ?? null,
        isWarmup: ex.isWarmup ?? false,
      })),
    };
  }

  const location = useLocation();
  const rawPlan = location.state?.initialPlan;

  const formInitialValues = useMemo(() => {
    const plan = rawPlan ? convertPlanToInitialValues(rawPlan) : undefined;

    // Logic to auto-select muscle groups (moved inside useMemo)
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

    // Return the final plan or a default empty object
    return (
      plan ?? {
        name: '',
        trainingGoalId: 0,
        intensityPresetId: 0,
        muscleGroupIds: [],
        exercises: [],
      }
    );
  }, [rawPlan, workoutMeta?.getMuscleGroups]); // Dependencies

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

  const isFromSession = rawPlan?.isFromSession;
  const bodyPartIds = rawPlan?.bodyPartIds ?? [];

  const autoDetectedMuscleGroupIds =
    workoutMeta?.getMuscleGroups
      ?.filter((group: MuscleGroupMeta) =>
        group.bodyParts.some((bp: any) => bodyPartIds.includes(bp.id)),
      )
      .map((group: MuscleGroupMeta) => group.id) ?? [];

  if (
    isFromSession &&
    formInitialValues &&
    formInitialValues.muscleGroupIds.length === 0
  ) {
    formInitialValues.muscleGroupIds = autoDetectedMuscleGroupIds;
  }

  return (
    <ScreenLayout>
      <Formik<FormValues>
        enableReinitialize
        initialValues={formInitialValues} // <-- Use the memoized values
        validationSchema={validationSchema}
        onSubmit={async values => {
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
            exercises: values.exercises.map((ex, index) => ({
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

          const selectedBodyPartIds = getSelectedBodyPartIds(
            values.muscleGroupIds,
            workoutMeta?.getMuscleGroups ?? [],
          );

          const filteredExercises = filterExercisesByBodyParts(
            exerciseData?.getExercises ?? [],
            selectedBodyPartIds,
          );

          const renderSummary = useWorkoutPlanSummary();

          // We need to use FieldArray to get the 'push' method for adding exercises
          return (
            <FieldArray name="exercises">
              {({push}) => {
                // Assign the push function to our ref so we can call it from the modal
                pushRef.current = push;

                const ListHeader = (
                  <>
                    <Title
                      text={
                        formInitialValues
                          ? 'Edit Workout Plan'
                          : 'Build Workout Plan'
                      }
                      subtitle={
                        formInitialValues
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
                        error={
                          touched.name && errors.name ? errors.name : undefined
                        }
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
                      {isFromSession && values.muscleGroupIds.length > 0 && (
                        <Text
                          style={{
                            marginTop: 4,
                            color: theme.colors.accentStart,
                          }}>
                          Muscle groups auto-selected based on your session. You
                          can adjust them.
                        </Text>
                      )}
                    </Card>
                    <View style={{padding: spacing.md}}>
                      <Title text="Exercises" />
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

                const renderNormalItem = ({
                  item: exercise,
                  index: idx,
                }: {
                  item: ExerciseFormEntry;
                  index: number;
                }) => (
                  <View
                    key={idx}
                    style={{
                      marginBottom: spacing.md,
                      padding: spacing.sm,
                      marginHorizontal: spacing.md,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: theme.colors.accentStart,
                    }}>
                    <TouchableOpacity
                      onPress={() =>
                        setExpandedExerciseIndex(
                          expandedExerciseIndex === idx ? null : idx,
                        )
                      }>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}>
                        <Text style={{color: theme.colors.textPrimary}}>
                          #{idx + 1} {exercise.exerciseName}
                        </Text>
                        <FontAwesome
                          name={
                            expandedExerciseIndex === idx
                              ? 'chevron-up'
                              : 'chevron-down'
                          }
                          style={{
                            fontSize: 16,
                            color: theme.colors.accentStart,
                            paddingRight: 5,
                            paddingBottom: 8,
                          }}
                        />
                      </View>
                    </TouchableOpacity>
                    {expandedExerciseIndex === idx && (
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
                            const updated = exercise.targetMetrics.map(m =>
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
                            Array.isArray(errors.exercises?.[idx])
                              ? undefined
                              : (errors.exercises?.[idx] as any)?.targetMetrics
                          }
                          touched={touched.exercises?.[idx]?.targetMetrics}
                        />
                        <SelectableField
                          label="Training Method"
                          value={
                            values.trainingGoalId
                              ? workoutMeta?.getTrainingGoals
                                  ?.find(
                                    (g: {id: number; trainingMethods: any[]}) =>
                                      g.id === values.trainingGoalId,
                                  )
                                  ?.trainingMethods?.find(
                                    (m: {id: number; name: string}) =>
                                      m.id === exercise.trainingMethodId,
                                  )?.name || 'Select Training Method'
                              : 'Select training goal to enable'
                          }
                          onPress={() => {
                            if (!values.trainingGoalId) return;
                            setSelectedExerciseIndex(idx);
                            setActiveModal('trainingMethodPicker');
                          }}
                          disabled={!values.trainingGoalId}
                        />
                        <View
                          style={{
                            marginBottom: spacing.sm,
                            marginTop: spacing.md,
                          }}>
                          <Button
                            text="Remove Exercise"
                            onPress={() => {
                              const newExercises = [...values.exercises];
                              newExercises.splice(idx, 1);
                              setFieldValue('exercises', newExercises);
                              setExpandedExerciseIndex(null);
                            }}
                          />
                        </View>
                      </>
                    )}
                  </View>
                );

                const renderDraggableItem = (params: any) => {
                  const {item, drag, isActive, getIndex} = params;
                  const index = getIndex?.() ?? 0;

                  return (
                    <ScaleDecorator>
                      <Pressable
                        onLongPress={drag}
                        style={{
                          marginBottom: spacing.md,
                          padding: spacing.sm,
                          marginHorizontal: spacing.md,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.colors.accentStart,
                          backgroundColor: isActive
                            ? theme.colors.surface
                            : theme.colors.background,
                        }}>
                        <Text style={{color: theme.colors.textPrimary}}>
                          #{index + 1} {item.exerciseName}
                        </Text>
                        <Text style={{color: theme.colors.textSecondary}}>
                          Sets: {item.targetSets}
                        </Text>
                        <Text style={{color: theme.colors.textSecondary}}>
                          {renderSummary({
                            exerciseId: item.exerciseId,
                            targetMetrics: item.targetMetrics,
                          })}
                        </Text>
                      </Pressable>
                    </ScaleDecorator>
                  );
                };

                const renderWebDraggableItem = (params: any) => {
                  const {item, index} = params;
                  return (
                    <Pressable
                      // @ts-ignore
                      style={{
                        marginBottom: spacing.md,
                        padding: spacing.sm,
                        marginHorizontal: spacing.md,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.accentStart,
                        backgroundColor: theme.colors.background,
                        cursor: 'grab',
                      }}>
                      <Text style={{color: theme.colors.textPrimary}}>
                        #{index + 1} {item.exerciseName}
                      </Text>
                      <Text style={{color: theme.colors.textSecondary}}>
                        Sets: {item.targetSets}
                      </Text>
                      <Text style={{color: theme.colors.textSecondary}}>
                        {renderSummary({
                          exerciseId: item.exerciseId,
                          targetMetrics: item.targetMetrics,
                        })}
                      </Text>
                    </Pressable>
                  );
                };

                return (
                  <>
                    {reorderMode ? (
                      Platform.OS === 'web' ? (
                        <WebDraggableList
                          data={values.exercises}
                          keyExtractor={(item: any) => item.instanceId}
                          onDragEnd={newOrder => {
                            setFieldValue('exercises', newOrder);
                          }}
                          ListHeaderComponent={ListHeader}
                          ListFooterComponent={ListFooter}
                          renderItem={renderWebDraggableItem}
                        />
                      ) : (
                        <DraggableFlatList
                          data={values.exercises}
                          keyExtractor={item => item.instanceId} // <-- Use the stable ID
                          onDragEnd={({data}) =>
                            setFieldValue('exercises', data)
                          }
                          ListHeaderComponent={ListHeader}
                          ListFooterComponent={ListFooter}
                          renderItem={renderDraggableItem}
                        />
                      )
                    ) : (
                      <FlatList
                        data={values.exercises}
                        keyExtractor={item => item.instanceId} // <-- Use the stable ID
                        ListHeaderComponent={ListHeader}
                        ListFooterComponent={ListFooter}
                        renderItem={renderNormalItem}
                      />
                    )}

                    {/* The ModalWrapper stays outside the list */}
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
                                '[DEBUG] FATAL: pushRef.current is not set! Cannot add exercises.',
                              );
                              return;
                            }

                            try {
                              newExercises.forEach(e => {
                                // This function is defined in your original code
                                const newTargetMetrics =
                                  createPlanningTargetMetrics(e.id);

                                const newExerciseObject = {
                                  instanceId: generateUniqueId(), // The unique ID we added
                                  exerciseId: e.id,
                                  exerciseName: e.name,
                                  targetSets: 3,
                                  targetMetrics: newTargetMetrics,
                                  isWarmup: false,
                                  trainingMethodId: undefined,
                                };

                                pushRef.current(newExerciseObject);
                              });

                              // This sets the newly added exercise to be the one that is expanded.
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
