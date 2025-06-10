import React, {useState, useRef} from 'react';
import {
  View,
  Alert,
  Text,
  TouchableOpacity,
  Pressable,
  Platform,
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
import IconButton from 'shared/components/IconButton';
import {useNavigate} from 'react-router-native';
import {useLocation} from 'react-router-native';
import {IntensityPreset} from 'modules/portals/appManagement/screens/AdminWorkoutPlanCatalogScreen';

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

  function convertPlanToInitialValues(plan: any): FormValues {
    const isFromSession = plan.isFromSession;

    if (isFromSession) {
      return {
        name: plan.name,
        trainingGoalId: plan.trainingGoal?.id,
        intensityPresetId: plan.intensityPreset?.id ?? undefined, // ✅ Add this
        experienceLevel: plan.intensityPreset?.experienceLevel ?? undefined, // ✅ Add this
        muscleGroupIds: [],
        exercises: plan.exercises.map((ex: any) => ({
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

    // Standard plan editing flow
    return {
      name: plan.name,
      trainingGoalId: plan.trainingGoal?.id,
      intensityPresetId: plan.intensityPreset?.id ?? undefined, // ✅ Add this
      experienceLevel: plan.intensityPreset?.experienceLevel ?? undefined, // ✅ Add this
      muscleGroupIds: plan.muscleGroups.map((mg: any) => mg.id),
      exercises: plan.exercises.map((ex: any) => ({
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
  const initialPlan = rawPlan ? convertPlanToInitialValues(rawPlan) : undefined;

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

  if (isFromSession && initialPlan && initialPlan.muscleGroupIds.length === 0) {
    initialPlan.muscleGroupIds = autoDetectedMuscleGroupIds;
  }

  const isEdit = !!initialPlan && !isFromSession;

  return (
    <ScreenLayout scroll>
      <Title
        text={initialPlan ? 'Edit Workout Plan' : 'Build Workout Plan'}
        subtitle={
          initialPlan
            ? 'Modify your existing workout session'
            : 'Create a reusable workout session'
        }
      />

      <Formik<FormValues>
        enableReinitialize
        initialValues={
          initialPlan ?? {
            name: '',
            trainingGoalId: 0,
            intensityPresetId: 0,
            muscleGroupIds: [],
            exercises: [],
          }
        }
        validationSchema={validationSchema}
        onSubmit={async values => {
          console.log(
            'Matching preset with:',
            values.trainingGoalId,
            values.experienceLevel,
          );
          console.log('Available presets:', workoutMeta?.getIntensityPresets);
          const matchedPreset = workoutMeta?.getIntensityPresets?.find(
            (p: any) =>
              p.trainingGoalId === values.trainingGoalId &&
              p.experienceLevel === values.experienceLevel,
          );
          console.log(matchedPreset);
          const transformedInput = {
            name: values.name,
            trainingGoalId: values.trainingGoalId,
            intensityPresetId: matchedPreset?.id ?? null, // ✅ assign it here
            muscleGroupIds: values.muscleGroupIds, // ✅ add this
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
          console.log(transformedInput);

          try {
            const result = isEdit
              ? await updateWorkoutPlan({
                  variables: {id: rawPlan.id, input: transformedInput},
                })
              : await createWorkoutPlan({variables: {input: transformedInput}});

            console.log(
              `✅ Workout Plan ${isEdit ? 'Updated' : 'Created'}:`,
              result,
            );
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

          return (
            <>
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
                {isFromSession && values.muscleGroupIds.length > 0 && (
                  <Text style={{marginTop: 4, color: theme.colors.accentStart}}>
                    Muscle groups auto-selected based on your session. You can
                    adjust them.
                  </Text>
                )}
              </Card>

              <Card title="Exercises">
                <View style={{marginBottom: spacing.md}}>
                  <Button
                    text={reorderMode ? 'Done Reordering' : 'Edit Order'}
                    disabled={values.exercises.length < 1}
                    onPress={() => setReorderMode(prev => !prev)}
                  />
                </View>
                <FieldArray name="exercises">
                  {({push, move}) => {
                    pushRef.current = push;

                    return (
                      <>
                        {reorderMode ? (
                          // 3. Add the platform check
                          Platform.OS === 'web' ? (
                            <WebDraggableList
                              data={values.exercises}
                              keyExtractor={(item: any, index: number) =>
                                `exercise-${item.exerciseId}-${index}`
                              }
                              onDragEnd={({data}: {data: any[]}) =>
                                setFieldValue('exercises', data)
                              }
                              renderItem={(params: any) => {
                                // The web version renderItem won't have `drag` or `isActive`
                                // but we can still reuse the same visual component.
                                const {item, index} = params;
                                return (
                                  <Pressable
                                    // @ts-ignore
                                    style={{
                                      marginBottom: spacing.md,
                                      padding: spacing.sm,
                                      borderRadius: 8,
                                      borderWidth: 1,
                                      borderColor: theme.colors.accentStart,
                                      backgroundColor: theme.colors.background, // isActive is false for web
                                      // Add a cursor to indicate it's draggable on web
                                      cursor: 'grab',
                                    }}>
                                    <Text
                                      style={{color: theme.colors.textPrimary}}>
                                      #{index + 1} {item.exerciseName}
                                    </Text>
                                    <Text
                                      style={{
                                        color: theme.colors.textSecondary,
                                      }}>
                                      Sets: {item.targetSets}
                                    </Text>
                                    <Text
                                      style={{
                                        color: theme.colors.textSecondary,
                                      }}>
                                      {renderSummary({
                                        exerciseId: item.exerciseId,
                                        targetMetrics: item.targetMetrics,
                                      })}
                                    </Text>
                                  </Pressable>
                                );
                              }}
                            />
                          ) : (
                            // This is your original DraggableFlatList for mobile
                            <DraggableFlatList
                              data={values.exercises}
                              keyExtractor={(item, index) =>
                                `exercise-${item.exerciseId}-${index}`
                              }
                              onDragEnd={({data}) =>
                                setFieldValue('exercises', data)
                              }
                              renderItem={params => {
                                const {item, drag, isActive, getIndex} = params;
                                const index = getIndex?.() ?? 0;
                                return (
                                  <ScaleDecorator>
                                    <Pressable
                                      onLongPress={drag}
                                      style={{
                                        marginBottom: spacing.md,
                                        padding: spacing.sm,
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: theme.colors.accentStart,
                                        backgroundColor: isActive
                                          ? theme.colors.accentStart
                                          : theme.colors.background,
                                      }}>
                                      <Text
                                        style={{
                                          color: theme.colors.textPrimary,
                                        }}>
                                        #{index + 1} {item.exerciseName}
                                      </Text>
                                      <Text
                                        style={{
                                          color: theme.colors.textSecondary,
                                        }}>
                                        Sets: {item.targetSets}
                                      </Text>
                                      <Text
                                        style={{
                                          color: theme.colors.textSecondary,
                                        }}>
                                        {renderSummary({
                                          exerciseId: item.exerciseId,
                                          targetMetrics: item.targetMetrics,
                                        })}
                                      </Text>
                                    </Pressable>
                                  </ScaleDecorator>
                                );
                              }}
                            />
                          )
                        ) : (
                          values.exercises.map((exercise, idx) => (
                            <View
                              key={idx}
                              style={{
                                marginBottom: spacing.md,
                                padding: spacing.sm,
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
                                  <Text
                                    style={{
                                      color: theme.colors.textPrimary,
                                    }}>
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
                                      Array.isArray(errors.exercises?.[idx])
                                        ? undefined
                                        : (errors.exercises?.[idx] as any)
                                            ?.targetMetrics
                                    }
                                    touched={
                                      touched.exercises?.[idx]?.targetMetrics
                                    }
                                  />
                                  <SelectableField
                                    label="Training Method"
                                    value={
                                      values.trainingGoalId
                                        ? workoutMeta?.getTrainingGoals
                                            ?.find(
                                              (g: {
                                                id: number;
                                                trainingMethods: any[];
                                              }) =>
                                                g.id === values.trainingGoalId,
                                            )
                                            ?.trainingMethods?.find(
                                              (m: {id: number; name: string}) =>
                                                m.id ===
                                                exercise.trainingMethodId,
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
                                  <View style={{marginBottom: spacing.sm}}>
                                    <Button
                                      text="Remove Exercise"
                                      onPress={() => {
                                        const newExercises = [
                                          ...values.exercises,
                                        ];
                                        newExercises.splice(idx, 1);
                                        setFieldValue(
                                          'exercises',
                                          newExercises,
                                        );
                                        setExpandedExerciseIndex(null);
                                      }}
                                    />
                                  </View>
                                </>
                              )}
                            </View>
                          ))
                        )}

                        <Button
                          text="Add Exercise"
                          onPress={() => setActiveModal('selectExercise')}
                        />
                      </>
                    );
                  }}
                </FieldArray>
              </Card>

              <Button
                text={isEdit ? 'Update Plan' : 'Save Plan'}
                onPress={handleSubmit as any}
              />

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
                      console.log(level);
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
                      newExercises.forEach(e =>
                        pushRef.current?.({
                          exerciseId: e.id,
                          exerciseName: e.name,
                          targetSets: 3,
                          targetMetrics: createPlanningTargetMetrics(e.id),
                          isWarmup: false,
                          trainingMethodId: undefined,
                        }),
                      );
                      setExpandedExerciseIndex(values.exercises.length);
                      setActiveModal(null);
                    }}
                  />
                )}
              </ModalWrapper>
            </>
          );
        }}
      </Formik>

      <ToastContainer />
    </ScreenLayout>
  );
}
