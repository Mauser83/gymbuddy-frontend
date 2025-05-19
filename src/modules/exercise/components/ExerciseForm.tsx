import React, {useState} from 'react';
import {ScrollView, Dimensions} from 'react-native';
import {useFormikContext} from 'formik';

import {
  ExerciseType,
  ExerciseDifficulty,
  Muscle,
} from '../types/exercise.types';
import {useReferenceData} from '../hooks/useReferenceData';

import FormInput from 'shared/components/FormInput';
import SelectableField from 'shared/components/SelectableField';
import ModalWrapper from 'shared/components/ModalWrapper';
import Title from 'shared/components/Title';
import ClickableList from 'shared/components/ClickableList';
import DividerWithLabel from 'shared/components/DividerWithLabel';
import Button from 'shared/components/Button';
import ManageReferenceModal from '../components/ManageReferenceModal';

const screenHeight = Dimensions.get('window').height;
const modalHeight = screenHeight * 0.8;

type ManageModalType = 'type' | 'difficulty' | 'bodyPart' | 'muscle' | null;

export default function ExerciseForm() {
  const {values, setFieldValue} = useFormikContext<any>();

  const {exerciseTypes, difficulties, muscles, bodyParts, refetchAll} =
    useReferenceData();

  const [activeModal, setActiveModal] = useState<
    null | 'type' | 'difficulty' | 'primary' | 'secondary' | 'equipment'
  >(null);

  const [selectedBodyPartId, setSelectedBodyPartId] = useState<number | null>(
    null,
  );
  const [manageModal, setManageModal] = useState<ManageModalType>(null);
  const [muscleStep, setMuscleStep] = useState<'bodyPart' | 'muscle'>(
    'bodyPart',
  );

  const primaryMuscles = muscles.filter(m =>
    values.primaryMuscleIds?.includes(m.id),
  );
  const secondaryMuscles = muscles.filter(m =>
    values.secondaryMuscleIds?.includes(m.id),
  );

  const handleMuscleToggle = (
    muscleId: number,
    field: 'primaryMuscleIds' | 'secondaryMuscleIds',
  ) => {
    const current: number[] = values[field] || [];
    const updated = current.includes(muscleId)
      ? current.filter(id => id !== muscleId)
      : [...current, muscleId];
    setFieldValue(field, updated);
  };

  const renderModalContent = () => {
    if (activeModal === 'type') {
      return (
        <>
          <Title text="Select Exercise Type" />
          <ClickableList
            items={exerciseTypes.map((t: ExerciseType) => ({
              id: t.id,
              label: t.name,
              onPress: () => {
                setFieldValue('exerciseTypeId', t.id);
                setActiveModal(null);
              },
            }))}
          />
          <DividerWithLabel label="OR" />
          <Button
            text="Manage Types"
            onPress={() => {
              setActiveModal(null);
              setManageModal('type');
            }}
          />
        </>
      );
    }

    if (activeModal === 'difficulty') {
      return (
        <>
          <Title text="Select Difficulty Level" />
          <ClickableList
            items={difficulties.map((d: ExerciseDifficulty) => ({
              id: d.id,
              label: d.level,
              onPress: () => {
                setFieldValue('difficultyId', d.id);
                setActiveModal(null);
              },
            }))}
          />
          <DividerWithLabel label="OR" />
          <Button
            text="Manage Difficulties"
            onPress={() => {
              setActiveModal(null);
              setManageModal('difficulty');
            }}
          />
        </>
      );
    }

    if (activeModal === 'primary' || activeModal === 'secondary') {
      const fieldName =
        activeModal === 'primary' ? 'primaryMuscleIds' : 'secondaryMuscleIds';
      const selectedMuscleIds = values[fieldName] || [];

      if (muscleStep === 'bodyPart') {
        return (
          <>
            <Title text="Select Body Part" />
            <ClickableList
              items={bodyParts.map(bp => ({
                id: bp.id,
                label: bp.name,
                onPress: () => {
                  setSelectedBodyPartId(bp.id);
                  setMuscleStep('muscle');
                },
              }))}
            />
            <DividerWithLabel label="OR" />
            <Button
              text="Manage Body Parts"
              onPress={() => {
                setActiveModal(null);
                setManageModal('bodyPart');
              }}
            />
          </>
        );
      }

      if (muscleStep === 'muscle' && selectedBodyPartId) {
        return (
          <>
            <Title text="Select Muscles" />
            <ScrollView
              style={{maxHeight: modalHeight - 200}}
              contentContainerStyle={{paddingHorizontal: 16}}>
              <ClickableList
                items={muscles
                  .filter((m: Muscle) => m.bodyPart.id === selectedBodyPartId)
                  .map((m: Muscle) => ({
                    id: m.id,
                    label: m.name,
                    selected: selectedMuscleIds.includes(m.id),
                    onPress: () => handleMuscleToggle(m.id, fieldName),
                  }))}
              />
            </ScrollView>

            <DividerWithLabel label="OR" />
            <Button
              text="Manage Muscles"
              onPress={() => {
                setActiveModal(null);
                setManageModal('muscle');
              }}
            />
          </>
        );
      }
    }

    return null;
  };

  return (
    <>
      <FormInput
        label="Exercise Name"
        placeholder="e.g., Barbell Squat"
        value={values.name}
        onChangeText={text => setFieldValue('name', text)}
      />

      <FormInput
        label="Description"
        placeholder="Optional description..."
        value={values.description}
        onChangeText={text => setFieldValue('description', text)}
      />

      <FormInput
        label="Video URL"
        placeholder="https://youtube.com/..."
        value={values.videoUrl || ''}
        onChangeText={text => setFieldValue('videoUrl', text || undefined)}
      />

      <SelectableField
        label="Exercise Type"
        value={
          exerciseTypes.find(
            (t: ExerciseType) => t.id === values.exerciseTypeId,
          )?.name || 'Select Type'
        }
        onPress={() => setActiveModal('type')}
      />

      <SelectableField
        label="Difficulty"
        value={
          difficulties.find(
            (d: ExerciseDifficulty) => d.id === values.difficultyId,
          )?.level || 'Select Level'
        }
        onPress={() => setActiveModal('difficulty')}
      />

      <SelectableField
        label="Primary Muscles"
        value={
          primaryMuscles.map((m: Muscle) => m.name).join(', ') ||
          'Select Muscles'
        }
        onPress={() => {
          setActiveModal('primary');
          setMuscleStep('bodyPart');
          setSelectedBodyPartId(null);
        }}
      />

      <SelectableField
        label="Secondary Muscles"
        value={
          secondaryMuscles.map((m: Muscle) => m.name).join(', ') ||
          'Select (Optional)'
        }
        onPress={() => {
          setActiveModal('secondary');
          setMuscleStep('bodyPart');
          setSelectedBodyPartId(null);
        }}
      />

      <ModalWrapper
        visible={!!activeModal}
        onClose={() => setActiveModal(null)}>
        {renderModalContent()}
      </ModalWrapper>

      {manageModal && (
        <ManageReferenceModal
          visible={!!manageModal}
          onClose={() => {
            setManageModal(null);
            refetchAll();
          }}
          mode={manageModal}
          bodyPartId={selectedBodyPartId || undefined}
        />
      )}
    </>
  );
}
