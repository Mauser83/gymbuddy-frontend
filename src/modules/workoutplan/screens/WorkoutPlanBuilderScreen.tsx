import React, {useState, useRef, useEffect} from 'react';
import {View, ScrollView, Alert, Text, TouchableOpacity} from 'react-native';
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
  UPDATE_MUSCLE_GROUP,
  CREATE_WORKOUT_PLAN,
  UPDATE_WORKOUT_PLAN,
} from '../graphql/workoutReferences';
import {MuscleGroup} from '../../portals/appManagement/components/EditMuscleGroupModal';
import {GET_EXERCISES_BASIC} from '../graphql/workoutMeta.graphql';
import {useAuth} from 'modules/auth/context/AuthContext';
import {spacing} from 'shared/theme/tokens';
import {useTheme} from 'shared/theme/ThemeProvider';
import FontAwesome from '@expo/vector-icons/FontAwesome5';
import IconButton from 'shared/components/IconButton';
import {useNavigate} from 'react-router-native';
import {Exercise} from '../types/workoutplan.types';
import {useLocation} from 'react-router-native';
import { IntensityPreset } from 'modules/portals/appManagement/screens/AdminWorkoutPlanCatalogScreen';

// 🧩 Modular modals
import SelectExerciseModal from '../components/SelectExerciseModal';
import TrainingGoalPickerModal from '../components/TrainingGoalPickerModal';
import DifficultyPickerModal from '../components/DifficultyPickerModal';
import MuscleGroupPickerModal from '../components/MuscleGroupPickerModal';
import TrainingMethodPicker from '../components/TrainingMethodPicker';

type ActiveModal =
  | null
  | 'trainingGoalPicker'
  | 'difficultyPicker'
  | 'muscleGroupPicker'
  | 'selectExercise'
  | 'trainingMethodPicker'

type FormValues = {
  name: string;
  trainingGoalId: number;
  intensityPresetId: number;
  experienceLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  muscleGroupIds: number[];
  exercises: Exercise[];
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
        targetReps: Yup.number().min(1).required('Reps required'),
        targetRpe: Yup.number().min(0).max(10).required('RPE required'),
      }),
    )
    .min(1, 'Add at least one exercise'),
});

export default function WorkoutPlanBuilderScreen() {
  const {user} = useAuth();
  const {theme} = useTheme();
  const navigate = useNavigate();
  const {data: workoutMeta, refetch} = useQuery(GET_WORKOUT_PLAN_META);
  const [updateMuscleGroup] = useMutation(UPDATE_MUSCLE_GROUP);
  const [createWorkoutPlan] = useMutation(CREATE_WORKOUT_PLAN);
  const [updateWorkoutPlan] = useMutation(UPDATE_WORKOUT_PLAN);

  const {data: exerciseData, loading: loadingExercises} =
    useQuery(GET_EXERCISES_BASIC);

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
  const [editMuscleGroupTarget, setEditMuscleGroupTarget] =
    useState<MuscleGroup | null>(null);

  const [reorderMode, setReorderMode] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<
    number | null
  >(null);
  const [expandedExerciseIndex, setExpandedExerciseIndex] = useState<
    number | null
  >(null);

  const [newPreset, setNewPreset] = useState<Partial<IntensityPreset>>({
    trainingGoalId: workoutMeta?.getTrainingGoals?.[0]?.id,
    experienceLevel: 'BEGINNER',
    defaultSets: 3,
    defaultReps: 10,
    defaultRestSec: 60,
    defaultRpe: 8,
  });

  const [presetModalDraft, setPresetModalDraft] =
    useState<Partial<IntensityPreset> | null>(null);
  const [onPresetValueSelect, setOnPresetValueSelect] = useState<
    ((value: any) => void) | null
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
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          targetRpe: ex.targetRpe,
          trainingMethodId: null,
          isWarmup: false,
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
        exerciseId: ex.exercise.id,
        exerciseName: ex.exercise.name,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        targetRpe: ex.targetRpe,
        trainingMethodId: ex.trainingMethod?.id,
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
              targetReps: ex.targetReps,
              targetRpe: ex.targetRpe,
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
                        {values.exercises.map((exercise, idx) => (
                          <View
                            key={idx}
                            style={{
                              marginBottom: spacing.md,
                              padding: spacing.sm,
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: theme.colors.accentStart,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}>
                            {/* Collapsed summary */}
                            {reorderMode || expandedExerciseIndex !== idx ? (
                              <>
                                <TouchableOpacity
                                  onPress={() => setExpandedExerciseIndex(idx)}
                                  style={{flex: 1}}>
                                  <View style={{flexDirection: 'column'}}>
                                    <Text
                                      style={{color: theme.colors.textPrimary}}>
                                      {`#${idx + 1} ${exercise.exerciseName}`}
                                    </Text>
                                    <Text
                                      style={{
                                        color: theme.colors.textSecondary,
                                      }}>
                                      {exercise.targetSets} x{' '}
                                      {exercise.targetReps} RPE{' '}
                                      {exercise.targetRpe}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                                <View style={{flexDirection: 'row'}}>
                                  {reorderMode ? (
                                    <>
                                      <IconButton
                                        icon={
                                          <FontAwesome
                                            name="arrow-alt-circle-up"
                                            style={{
                                              fontSize: 32,
                                              color: theme.colors.textPrimary,
                                            }}
                                          />
                                        }
                                        size="small"
                                        onPress={() => move(idx, idx - 1)}
                                        disabled={idx === 0}
                                      />
                                      <IconButton
                                        icon={
                                          <FontAwesome
                                            name="arrow-alt-circle-down"
                                            style={{
                                              fontSize: 32,
                                              color: theme.colors.textPrimary,
                                            }}
                                          />
                                        }
                                        size="small"
                                        onPress={() => move(idx, idx + 1)}
                                        disabled={
                                          idx === values.exercises.length - 1
                                        }
                                      />
                                    </>
                                  ) : (
                                    <TouchableOpacity
                                      onPress={() =>
                                        setExpandedExerciseIndex(idx)
                                      }>
                                      <View style={{paddingRight: 5}}>
                                        <FontAwesome
                                          name={
                                            expandedExerciseIndex === idx
                                              ? 'chevron-up'
                                              : 'chevron-down'
                                          }
                                          style={{
                                            fontSize: 16,
                                            color: theme.colors.accentStart,
                                          }}
                                        />
                                      </View>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </>
                            ) : (
                              <View style={{flex: 1}}>
                                <TouchableOpacity
                                  onPress={() =>
                                    setExpandedExerciseIndex(
                                      expandedExerciseIndex === idx
                                        ? null
                                        : idx,
                                    )
                                  }>
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}>
                                    <Title
                                      text={`#${idx + 1} ${exercise.exerciseName}`}
                                      align="left"
                                    />
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
                                <FormInput
                                  label="Reps per Set"
                                  value={String(exercise.targetReps)}
                                  onChangeText={text =>
                                    setFieldValue(
                                      `exercises[${idx}].targetReps`,
                                      parseInt(text, 10) || 0,
                                    )
                                  }
                                  keyboardType="numeric"
                                />
                                <FormInput
                                  label="Target RPE"
                                  value={String(exercise.targetRpe)}
                                  onChangeText={text =>
                                    setFieldValue(
                                      `exercises[${idx}].targetRpe`,
                                      parseFloat(text) || 0,
                                    )
                                  }
                                  keyboardType="numeric"
                                />
                                <SelectableField
                                  label="Training Method"
                                  value={
                                    workoutMeta?.getTrainingMethods?.find(
                                      (m: any) =>
                                        m.id === exercise.trainingMethodId,
                                    )?.name || 'Select Training Method'
                                  }
                                  onPress={() => {
                                    setSelectedExerciseIndex(idx); // track which index we’re editing
                                    setActiveModal('trainingMethodPicker');
                                  }}
                                />
                                <View style={{marginBottom: spacing.sm}}>
                                  <Button
                                    text="Remove Exercise"
                                    onPress={() => {
                                      const newExercises = [
                                        ...values.exercises,
                                      ];
                                      newExercises.splice(idx, 1);
                                      setFieldValue('exercises', newExercises);

                                      // Optionally reset expanded index
                                      setExpandedExerciseIndex(null);
                                    }}
                                  />
                                </View>
                              </View>
                            )}
                          </View>
                        ))}

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
                    trainingMethods={workoutMeta?.getTrainingMethods ?? []}
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
                          targetReps: 10,
                          targetRpe: 8,
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
