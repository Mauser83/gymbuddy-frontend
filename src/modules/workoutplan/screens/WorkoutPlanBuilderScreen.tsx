import React, {useState} from 'react';
import {View, ScrollView, Alert} from 'react-native';
import {Formik, FieldArray} from 'formik';
import * as Yup from 'yup';
import ScreenLayout from 'shared/components/ScreenLayout';
import Title from 'shared/components/Title';
import FormInput from 'shared/components/FormInput';
import Button from 'shared/components/Button';
import Card from 'shared/components/Card';
import SelectableField from 'shared/components/SelectableField';
import ToastContainer from 'shared/components/ToastContainer';
import {useTheme} from 'shared/theme/ThemeProvider';
import OptionItem from 'shared/components/OptionItem';
import ModalWrapper from 'shared/components/ModalWrapper';
import {GET_WORKOUT_PLAN_META} from '../graphql/workoutMeta.graphql';
import {useQuery, useMutation} from '@apollo/client';
import ManageWorkoutReferenceModal from '../components/ManageWorkoutReferenceModal';
import AssignWorkoutTypesToCategoryModal from '../components/AssignWorkoutTypesToCategoryModal';
import {ASSIGN_WORKOUT_TYPES_TO_CATEGORY} from '../graphql/workoutReferences';

type ReferenceMode =
  | 'workoutCategory'
  | 'workoutType'
  | 'muscleGroup'
  | 'trainingMethod';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Plan name is required'),
  workoutCategoryId: Yup.number().required('Workout category is required'),
  workoutTypeId: Yup.number().required('Workout type is required'),
  muscleGroupIds: Yup.array().of(Yup.number()),
  exercises: Yup.array()
    .of(
      Yup.object().shape({
        exerciseName: Yup.string().required('Exercise name required'),
        targetSets: Yup.number().min(1).required('Sets required'),
        targetReps: Yup.number().min(1).required('Reps required'),
        targetRpe: Yup.number().min(0).max(10).required('RPE required'),
        isWarmup: Yup.boolean().required(),
      }),
    )
    .min(1, 'Add at least one exercise'),
});

export default function WorkoutPlanBuilderScreen() {
  const {componentStyles} = useTheme();
  const {data: workoutMeta, refetch} = useQuery(GET_WORKOUT_PLAN_META);
  const [updateCategoryTypes] = useMutation(ASSIGN_WORKOUT_TYPES_TO_CATEGORY);

  const [showWorkoutCategoryPicker, setShowWorkoutCategoryPicker] =
    useState(false);

  const [showWorkoutTypePicker, setShowWorkoutTypePicker] = useState(false);
  const [showMuscleGroupPicker, setShowMuscleGroupPicker] = useState(false);
  const [manageModalMode, setManageModalMode] = useState<ReferenceMode | null>(
    null,
  );

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);

  console.log(workoutMeta);

  return (
    <ScreenLayout scroll>
      <Title
        text="Build Workout Plan"
        subtitle="Create a reusable workout session"
      />

      <Formik<{
        name: string;
        workoutCategoryId: number;
        workoutTypeId: number;
        muscleGroupIds: number[];
        exercises: {
          exerciseName: string;
          targetSets: number;
          targetReps: number;
          targetRpe: number;
          isWarmup: boolean;
        }[];
      }>
        initialValues={{
          name: '',
          workoutCategoryId: 0,
          workoutTypeId: 0,
          muscleGroupIds: [],
          exercises: [],
        }}
        validationSchema={validationSchema}
        onSubmit={values => {
          console.log('Saved Plan:', values);
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
          const getReferenceItems = () => {
            switch (manageModalMode) {
              case 'workoutType':
                return workoutMeta.getWorkoutTypes;
              case 'muscleGroup':
                return workoutMeta.getMuscleGroups;
              case 'workoutCategory':
                return workoutMeta.getWorkoutCategories;
              case 'trainingMethod':
                return workoutMeta.getTrainingMethods;
              default:
                return [];
            }
          };
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
                  onPress={() => setShowWorkoutCategoryPicker(true)}
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
                  onPress={() => setShowWorkoutTypePicker(true)}
                  disabled={!values.workoutCategoryId}
                />
                <SelectableField
                  label="Muscle Groups"
                  value={
                    values.muscleGroupIds.length > 0
                      ? `${values.muscleGroupIds.length} selected`
                      : 'Select Muscle Groups'
                  }
                  onPress={() => setShowMuscleGroupPicker(true)}
                  disabled={!values.workoutTypeId}
                />
              </Card>

              <Card title="Exercises">
                <FieldArray name="exercises">
                  {({push}) => (
                    <>
                      {values.exercises.map((exercise, idx) => (
                        <View key={idx} style={{marginBottom: 16}}>
                          <FormInput
                            label={
                              `Exercise #${idx + 1}` +
                              (exercise.isWarmup ? ' (Warmup)' : '')
                            }
                            value={exercise.exerciseName}
                            onChangeText={text =>
                              setFieldValue(
                                `exercises[${idx}].exerciseName`,
                                text,
                              )
                            }
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
                      ))}
                      <Button
                        text="Add Exercise"
                        onPress={() => {
                          push({
                            exerciseName: 'Exercise Name',
                            targetSets: 3,
                            targetReps: 10,
                            targetRpe: 8,
                            isWarmup: false,
                          });
                          push({
                            exerciseName: 'Exercise Name (Warmup)',
                            targetSets: 2,
                            targetReps: 10,
                            targetRpe: 5,
                            isWarmup: true,
                          });
                        }}
                      />
                    </>
                  )}
                </FieldArray>
              </Card>

              <Button text="Save Plan" onPress={handleSubmit as any} />

              <ModalWrapper
                visible={showWorkoutCategoryPicker}
                onClose={() => setShowWorkoutCategoryPicker(false)}>
                <Title text="Select Workout Category" />
                <ScrollView>
                  {workoutMeta?.getWorkoutCategories?.map(
                    (cat: {id: number; name: string}) => (
                      <OptionItem
                        key={cat.id}
                        text={cat.name}
                        onPress={() => {
                          setFieldValue('workoutCategoryId', cat.id);
                          setFieldValue('workoutTypeId', 0); // Reset type when category changes
                          setShowWorkoutCategoryPicker(false);
                        }}
                      />
                    ),
                  )}
                </ScrollView>
                <Button
                  text="Manage Categories"
                  onPress={() => setManageModalMode('workoutCategory')} // or another mode if you separate category management
                />
              </ModalWrapper>

              {/* Workout Type Picker */}
              <ModalWrapper
                visible={showWorkoutTypePicker}
                onClose={() => setShowWorkoutTypePicker(false)}>
                <Title text="Select Workout Type" />
                <ScrollView>
                  {workoutMeta?.getWorkoutCategories
                    ?.find((c: any) => c.id === values.workoutCategoryId)
                    ?.workoutTypes.map((type: any) => (
                      <OptionItem
                        key={type.id}
                        text={type.name}
                        onPress={() => {
                          setFieldValue('workoutTypeId', type.id);
                          setShowWorkoutTypePicker(false);
                        }}
                      />
                    ))}
                </ScrollView>

                <Button
                  text="Assign Workout Types"
                  onPress={() => {
                    const currentCategory =
                      workoutMeta?.getWorkoutCategories.find(
                        (cat: any) => cat.id === values.workoutCategoryId,
                      );

                    setSelectedTypeIds(
                      currentCategory?.workoutTypes.map((t: any) => t.id) ?? [],
                    );
                    setAssignModalOpen(true);
                    setShowWorkoutTypePicker(false);
                  }}
                />
              </ModalWrapper>

              {/* Muscle Group Picker */}
              <ModalWrapper
                visible={showMuscleGroupPicker}
                onClose={() => setShowMuscleGroupPicker(false)}>
                <Title text="Select Muscle Groups" />
                <ScrollView>
                  {workoutMeta?.getMuscleGroups?.map(
                    (group: {id: number; name: string}) => {
                      const selected = values.muscleGroupIds.includes(group.id);
                      return (
                        <OptionItem
                          key={group.id}
                          text={group.name + (selected ? ' ✅' : '')}
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
                    },
                  )}
                </ScrollView>
                <Button
                  text="Done"
                  onPress={() => setShowMuscleGroupPicker(false)}
                />
                <Button
                  text="Manage Muscle Groups"
                  onPress={() => setManageModalMode('muscleGroup')}
                />
              </ModalWrapper>
              {manageModalMode && workoutMeta && (
                <ManageWorkoutReferenceModal
                  visible={!!manageModalMode}
                  mode={manageModalMode}
                  onClose={() => setManageModalMode(null)}
                  items={getReferenceItems()}
                  refetch={() => refetch()}
                  categoryId={
                    manageModalMode === 'workoutType'
                      ? values.workoutCategoryId
                      : undefined
                  }
                  categoryTypeIds={
                    manageModalMode === 'workoutType'
                      ? (workoutMeta.getWorkoutCategories
                          ?.find(
                            (cat: any) => cat.id === values.workoutCategoryId,
                          )
                          ?.workoutTypes.map((t: any) => t.id) ?? [])
                      : []
                  }
                  bodyPartOptions={
                    manageModalMode === 'muscleGroup'
                      ? workoutMeta.allBodyParts?.map(
                          ({id, name}: {id: number; name: string}) => ({
                            id,
                            name,
                          }),
                        )
                      : undefined
                  }
                />
              )}

              {assignModalOpen && (
                <AssignWorkoutTypesToCategoryModal
                  visible={assignModalOpen}
                  onClose={() => setAssignModalOpen(false)}
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
                    await refetch(); // to refresh the category list with updated type IDs
                    setAssignModalOpen(false);
                  }}
                  onManage={() => {
                    setManageModalMode('workoutType');
                    setAssignModalOpen(false);
                  }}
                />
              )}
            </>
          );
        }}
      </Formik>

      <ToastContainer />
    </ScreenLayout>
  );
}
