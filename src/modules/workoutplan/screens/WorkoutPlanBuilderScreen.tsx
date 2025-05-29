import React, {useState, useRef} from 'react';
import {View, ScrollView, Alert, Text} from 'react-native';
import {Formik, FieldArray} from 'formik';
import * as Yup from 'yup';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import Card from 'shared/components/Card';
import SelectableField from 'shared/components/SelectableField';
import ToastContainer from 'shared/components/ToastContainer';
import OptionItem from 'shared/components/OptionItem';
import ModalWrapper from 'shared/components/ModalWrapper';
import {GET_WORKOUT_PLAN_META} from '../graphql/workoutMeta.graphql';
import {useQuery, useMutation} from '@apollo/client';
import ManageWorkoutReferenceModal from '../components/ManageWorkoutReferenceModal';
import AssignWorkoutTypesToCategoryModal from '../components/AssignWorkoutTypesToCategoryModal';
import {
  ASSIGN_WORKOUT_TYPES_TO_CATEGORY,
  UPDATE_MUSCLE_GROUP,
} from '../graphql/workoutReferences';
import {MuscleGroup} from '../components/EditMuscleGroupModal';
import EditMuscleGroupModal from '../components/EditMuscleGroupModal';
import {GET_EXERCISES_BASIC} from '../graphql/workoutMeta.graphql';
import SelectExerciseModal from '../components/SelectExerciseModal';
import {useAuth} from 'modules/auth/context/AuthContext';
import {spacing} from 'shared/theme/tokens';
import {useTheme} from 'shared/theme/ThemeProvider';
import FontAwesome from '@expo/vector-icons/FontAwesome5';
import IconButton from 'shared/components/IconButton';

type ActiveModal =
  | null
  | 'categoryPicker'
  | 'typePicker'
  | 'muscleGroupPicker'
  | 'assignWorkoutTypes'
  | 'manageWorkoutCategory'
  | 'manageWorkoutType'
  | 'manageMuscleGroup'
  | 'manageTrainingMethod'
  | 'editMuscleGroup'
  | 'selectExercise';

type Exercise = {
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  targetRpe: number;
};

type FormValues = {
  name: string;
  workoutCategoryId: number;
  workoutTypeId: number;
  muscleGroupIds: number[];
  exercises: Exercise[];
};

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Plan name is required'),
  workoutCategoryId: Yup.number().required('Workout category is required'),
  workoutTypeId: Yup.number().required('Workout type is required'),
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
  const {data: workoutMeta, refetch} = useQuery(GET_WORKOUT_PLAN_META);
  const [updateCategoryTypes] = useMutation(ASSIGN_WORKOUT_TYPES_TO_CATEGORY);
  const [updateMuscleGroup] = useMutation(UPDATE_MUSCLE_GROUP);
  const {data: exerciseData, loading: loadingExercises} =
    useQuery(GET_EXERCISES_BASIC);

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
  const [editMuscleGroupTarget, setEditMuscleGroupTarget] =
    useState<MuscleGroup | null>(null);

  const [reorderMode, setReorderMode] = useState(false);

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
    <ScreenLayout scroll>
      <Title
        text="Build Workout Plan"
        subtitle="Create a reusable workout session"
      />

      <Formik<FormValues>
        initialValues={{
          name: '',
          workoutCategoryId: 0,
          workoutTypeId: 0,
          muscleGroupIds: [],
          exercises: [],
        }}
        validationSchema={validationSchema}
        onSubmit={values => {
          Alert.alert('Workout Plan Saved!', 'This is stored locally for now.');
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
          const getReferenceItems = (mode: ActiveModal) => {
            switch (mode) {
              case 'manageWorkoutType':
                return workoutMeta.getWorkoutTypes;
              case 'manageMuscleGroup':
                return workoutMeta.getMuscleGroups;
              case 'manageWorkoutCategory':
                return workoutMeta.getWorkoutCategories;
              case 'manageTrainingMethod':
                return workoutMeta.getTrainingMethods;
              default:
                return [];
            }
          };

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
                  label="Workout Category"
                  value={
                    workoutMeta?.getWorkoutCategories?.find(
                      (cat: any) => cat.id === values.workoutCategoryId,
                    )?.name || 'Select Workout Category'
                  }
                  onPress={() => setActiveModal('categoryPicker')}
                />
                <SelectableField
                  label="Workout Type"
                  value={
                    workoutMeta?.getWorkoutCategories
                      ?.find((c: any) => c.id === values.workoutCategoryId)
                      ?.workoutTypes.find(
                        (t: any) => t.id === values.workoutTypeId,
                      )?.name || 'Select Workout Type'
                  }
                  onPress={() => setActiveModal('typePicker')}
                  disabled={!values.workoutCategoryId}
                />
                <SelectableField
                  label="Muscle Groups"
                  value={
                    values.muscleGroupIds.length > 0
                      ? `${values.muscleGroupIds.length} selected`
                      : 'Select Muscle Groups'
                  }
                  onPress={() => setActiveModal('muscleGroupPicker')}
                  disabled={!values.workoutTypeId}
                />
              </Card>

              <Card title="Exercises">
                <View style={{marginBottom: spacing.md}}>
                  <Button
                    text={reorderMode ? 'Done Reordering' : 'Edit Order'}
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
                            {reorderMode ? (
                              <>
                                <View style={{flexDirection: 'column'}}>
                                  <Text
                                    style={{color: theme.colors.textPrimary}}>
                                    {exercise.exerciseName}
                                  </Text>
                                  <Text
                                    style={{color: theme.colors.textSecondary}}>
                                    {exercise.targetSets} x{' '}
                                    {exercise.targetReps} RPE{' '}
                                    {exercise.targetRpe}
                                  </Text>
                                </View>
                                <View style={{flexDirection: 'row'}}>
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
                                </View>
                              </>
                            ) : (
                              <View style={{flex: 1}}>
                                <Title
                                  text={`#${idx + 1} ${exercise.exerciseName}`} align="left"
                                />
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

              <Button text="Save Plan" onPress={handleSubmit as any} />

              <ModalWrapper
                visible={!!activeModal}
                onClose={() => setActiveModal(null)}>
                {activeModal === 'categoryPicker' && (
                  <>
                    <Title text="Select Workout Category" />
                    <ScrollView>
                      {workoutMeta?.getWorkoutCategories
                        ?.slice()
                        .sort((a: any, b: any) => a.name.localeCompare(b.name))
                        .map((cat: any) => (
                          <OptionItem
                            key={cat.id}
                            text={cat.name}
                            onPress={() => {
                              setFieldValue('workoutCategoryId', cat.id);
                              setFieldValue('workoutTypeId', 0);
                              setActiveModal(null);
                            }}
                          />
                        ))}
                    </ScrollView>
                    <View style={{marginTop: spacing.md}}>
                      <Button
                        text="Close"
                        onPress={() => setActiveModal(null)}
                      />
                    </View>
                    {user &&
                      (user.appRole === 'ADMIN' ||
                        user.appRole === 'MODERATOR') && (
                        <View style={{marginTop: spacing.md}}>
                          <Button
                            text="Manage Categories"
                            onPress={() =>
                              setActiveModal('manageWorkoutCategory')
                            }
                          />
                        </View>
                      )}
                  </>
                )}

                {activeModal === 'typePicker' && (
                  <>
                    <Title text="Select Workout Type" />
                    <ScrollView>
                      {workoutMeta?.getWorkoutCategories
                        ?.find((c: any) => c.id === values.workoutCategoryId)
                        ?.workoutTypes.slice()
                        .sort((a: any, b: any) => a.name.localeCompare(b.name))
                        .map((type: any) => (
                          <OptionItem
                            key={type.id}
                            text={type.name}
                            onPress={() => {
                              setFieldValue('workoutTypeId', type.id);
                              setActiveModal(null);
                            }}
                          />
                        ))}
                    </ScrollView>
                    <View style={{marginTop: spacing.md}}>
                      <Button
                        text="Close"
                        onPress={() => setActiveModal(null)}
                      />
                    </View>
                    {user &&
                      (user.appRole === 'ADMIN' ||
                        user.appRole === 'MODERATOR') && (
                        <View style={{marginTop: spacing.md}}>
                          <Button
                            text="Assign Workout Types"
                            onPress={() => {
                              const currentCategory =
                                workoutMeta?.getWorkoutCategories.find(
                                  (cat: any) =>
                                    cat.id === values.workoutCategoryId,
                                );
                              setSelectedTypeIds(
                                currentCategory?.workoutTypes.map(
                                  (t: any) => t.id,
                                ) ?? [],
                              );
                              setActiveModal('assignWorkoutTypes');
                            }}
                          />
                        </View>
                      )}
                  </>
                )}

                {activeModal === 'muscleGroupPicker' && (
                  <>
                    <Title text="Select Muscle Groups" />
                    <ScrollView>
                      {workoutMeta?.getMuscleGroups
                        ?.slice()
                        .sort((a: any, b: any) => a.name.localeCompare(b.name))
                        .map((group: any) => {
                          const selected = values.muscleGroupIds.includes(
                            group.id,
                          );
                          return (
                            <OptionItem
                              key={group.id}
                              text={group.name}
                              selected={selected}
                              onPress={() => {
                                const newIds = selected
                                  ? values.muscleGroupIds.filter(
                                      (id: number) => id !== group.id,
                                    )
                                  : [...values.muscleGroupIds, group.id];
                                setFieldValue('muscleGroupIds', newIds);
                              }}
                            />
                          );
                        })}
                    </ScrollView>
                    <View style={{marginTop: spacing.md}}>
                      <Button
                        text="Close"
                        onPress={() => setActiveModal(null)}
                      />
                    </View>
                    {user &&
                      (user.appRole === 'ADMIN' ||
                        user.appRole === 'MODERATOR') && (
                        <View style={{marginTop: spacing.md}}>
                          <Button
                            text="Manage Muscle Groups"
                            onPress={() => setActiveModal('manageMuscleGroup')}
                          />
                        </View>
                      )}
                  </>
                )}

                {activeModal === 'assignWorkoutTypes' && (
                  <AssignWorkoutTypesToCategoryModal
                    visible
                    onClose={() => setActiveModal(null)}
                    workoutTypes={workoutMeta?.getWorkoutTypes ?? []}
                    selectedTypeIds={selectedTypeIds}
                    onChange={setSelectedTypeIds}
                    onSave={async () => {
                      await updateCategoryTypes({
                        variables: {
                          categoryId: values.workoutCategoryId,
                          input: {workoutTypeIds: selectedTypeIds},
                        },
                      });
                      await refetch();
                      setActiveModal(null);
                    }}
                    onManage={() => setActiveModal('manageWorkoutType')}
                  />
                )}

                {[
                  'manageWorkoutType',
                  'manageMuscleGroup',
                  'manageWorkoutCategory',
                  'manageTrainingMethod',
                ].includes(activeModal!) && (
                  <ManageWorkoutReferenceModal
                    visible
                    mode={
                      (activeModal!
                        .replace('manage', '')
                        .charAt(0)
                        .toLowerCase() +
                        activeModal!.replace('manage', '').slice(1)) as any
                    }
                    onClose={() => setActiveModal(null)}
                    items={getReferenceItems(activeModal)}
                    refetch={refetch}
                    categoryId={
                      activeModal === 'manageWorkoutType'
                        ? values.workoutCategoryId
                        : undefined
                    }
                    categoryTypeIds={
                      activeModal === 'manageWorkoutType'
                        ? (workoutMeta?.getWorkoutCategories
                            ?.find(
                              (cat: any) => cat.id === values.workoutCategoryId,
                            )
                            ?.workoutTypes.map((t: any) => t.id) ?? [])
                        : []
                    }
                    bodyPartOptions={
                      activeModal === 'manageMuscleGroup'
                        ? workoutMeta?.allBodyParts?.map(({id, name}: any) => ({
                            id,
                            name,
                          }))
                        : undefined
                    }
                    onEditMuscleGroup={muscleGroup => {
                      setEditMuscleGroupTarget(muscleGroup);
                      setActiveModal('editMuscleGroup');
                    }}
                  />
                )}

                {activeModal === 'editMuscleGroup' && editMuscleGroupTarget && (
                  <EditMuscleGroupModal
                    visible
                    muscleGroup={editMuscleGroupTarget}
                    bodyPartOptions={workoutMeta?.allBodyParts ?? []}
                    onClose={() => {
                      setActiveModal('manageMuscleGroup');
                      setEditMuscleGroupTarget(null);
                    }}
                    onSave={async (name, bodyPartIds) => {
                      await updateMuscleGroup({
                        variables: {
                          id: editMuscleGroupTarget.id,
                          input: {
                            name,
                            slug: name.toLowerCase().replace(/\s+/g, '-'),
                            bodyPartIds,
                          },
                        },
                      });
                      await refetch();
                      setEditMuscleGroupTarget(null);
                      setActiveModal('manageMuscleGroup');
                    }}
                  />
                )}

                {activeModal === 'selectExercise' && (
                  <SelectExerciseModal
                    onClose={() => setActiveModal(null)}
                    filteredExercises={filteredExercises}
                    onSelect={newExercises => {
                      newExercises.forEach(e =>
                        pushRef.current?.({
                          exerciseName: e.name,
                          targetSets: 3,
                          targetReps: 10,
                          targetRpe: 8,
                          isWarmup: false,
                        }),
                      );
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
