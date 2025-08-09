import React, {useState, useMemo} from 'react';
import {ScrollView, View, Dimensions} from 'react-native';
import {useFormikContext} from 'formik';
import {useReferenceData} from '../hooks/useReferenceData';
import FormInput from 'shared/components/FormInput';
import SelectableField from 'shared/components/SelectableField';
import ModalWrapper from 'shared/components/ModalWrapper';
import Title from 'shared/components/Title';
import Button from 'shared/components/Button';
import DividerWithLabel from 'shared/components/DividerWithLabel';
import EquipmentSlotModal from '../../../features/exercises/components/EquipmentSlotModal';
import ClickableList from 'shared/components/ClickableList';
import {
  ExerciseType,
  ExerciseDifficulty,
  Muscle,
} from '../types/exercise.types';
import Toast from 'react-native-toast-message';
import ButtonRow from 'shared/components/ButtonRow';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useTheme} from 'shared/theme/ThemeProvider';
import DetailField from 'shared/components/DetailField';

const screenHeight = Dimensions.get('window').height;
const modalHeight = screenHeight * 0.8;

export default function ExerciseForm() {
  const {theme} = useTheme();
  const {values, setFieldValue} = useFormikContext<any>();
  const {
    equipmentSubcategories,
    exerciseTypes,
    difficulties,
    muscles,
    bodyParts,
    refetchAll,
  } = useReferenceData();
    const sortedSubcategories = useMemo(
    () =>
      [...equipmentSubcategories].sort((a, b) => a.name.localeCompare(b.name)),
    [equipmentSubcategories],
  );
  const sortedMuscles = useMemo(
    () => [...muscles].sort((a, b) => a.name.localeCompare(b.name)),
    [muscles],
  );
  const sortedBodyParts = useMemo(
    () => [...bodyParts].sort((a, b) => a.name.localeCompare(b.name)),
    [bodyParts],
  );
  const sortedExerciseTypes = useMemo(
    () => [...exerciseTypes].sort((a, b) => a.name.localeCompare(b.name)),
    [exerciseTypes],
  );
  const sortedDifficulties = useMemo(
    () => [...difficulties].sort((a, b) => a.level.localeCompare(b.level)),
    [difficulties],
  );
  const [slotModalVisible, setSlotModalVisible] = useState(false);
  const [slotEditIndex, setSlotEditIndex] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<
    null | 'type' | 'difficulty' | 'primary' | 'secondary'
  >(null);
  const [selectedBodyPartId, setSelectedBodyPartId] = useState<number | null>(
    null,
  );
  const [muscleStep, setMuscleStep] = useState<'bodyPart' | 'muscle'>(
    'bodyPart',
  );
  const [expandedSlotIndex, setExpandedSlotIndex] = useState<number | null>(
    null,
  );

  const openEditSlot = (index: number) => {
    setSlotEditIndex(index);
    setSlotModalVisible(true);
  };

  const deleteSlot = (index: number) => {
    const updated = values.equipmentSlots.filter(
      (_: any, i: number) => i !== index,
    );
    setFieldValue('equipmentSlots', updated);
  };

  const saveSlot = (slot: any) => {
    const isEditing = slotEditIndex !== null;
    const currentSlots = [...(values.equipmentSlots || [])];

    // Determine which subcategory IDs are already in use — excluding the current slot if editing
    const otherSubcategoryIds = currentSlots
      .filter((_: any, i: number) => !isEditing || i !== slotEditIndex)
      .flatMap((s: any) => s.options.map((opt: any) => opt.subcategoryId));

    const newSubcategoryIds = slot.options.map((opt: any) => opt.subcategoryId);

    const hasDuplicates = newSubcategoryIds.some((id: any) =>
      otherSubcategoryIds.includes(id),
    );

    if (hasDuplicates) {
      Toast.show({
        type: 'error',
        text1: 'Subcategory already used in another slot.',
      });
      return;
    }

    // Proceed to save slot
    if (isEditing && slotEditIndex !== null) {
      currentSlots[slotEditIndex] = {...slot};
    } else {
      if (currentSlots.length >= 5) {
        Toast.show({type: 'error', text1: 'Maximum of 5 slots allowed.'});
        return;
      }
      currentSlots.push(slot);
    }

    setFieldValue('equipmentSlots', currentSlots);
    setSlotEditIndex(null);
    setSlotModalVisible(false);
  };

  const handleMuscleToggle = (
    muscleId: number,
    field: 'primaryMuscleIds' | 'secondaryMuscleIds',
  ) => {
    const conflictField =
      field === 'primaryMuscleIds' ? 'secondaryMuscleIds' : 'primaryMuscleIds';
    const current: number[] = values[field] || [];
    const updated = current.includes(muscleId)
      ? current.filter(id => id !== muscleId)
      : [...current, muscleId];

    const cleanedOther = (values[conflictField] || []).filter(
      (id: number) => id !== muscleId,
    );
    setFieldValue(field, updated);
    setFieldValue(conflictField, cleanedOther);
  };

  const primaryMuscles = sortedMuscles.filter((m: Muscle) =>
    values.primaryMuscleIds?.includes(m.id),
  );
  const secondaryMuscles = sortedMuscles.filter((m: Muscle) =>
    values.secondaryMuscleIds?.includes(m.id),
  );

  const renderSlotList = () => {
    return (
      <ClickableList
        items={(values.equipmentSlots || []).map((slot: any, index: number) => {
          const isExpanded = expandedSlotIndex === index;

          const slotLabel =
            `Slot ${index + 1}: ${slot.options.length} item(s)` +
            (slot.isRequired ? ' (Required)' : ' (Optional)');

          const optionLines = slot.options.map((opt: any) => {
            const match = sortedSubcategories.find(
              s => s.id === opt.subcategoryId,
            );
            return match
              ? `${match.name} (${match.category?.name || 'Other'})`
              : `#${opt.subcategoryId}`;
          });

          return {
            id: index,
            label: slotLabel,
            onPress: () => setExpandedSlotIndex(isExpanded ? null : index),
            rightElement: (
              <FontAwesome
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.colors.accentStart}
              />
            ),
            content: isExpanded && (
              <View style={{marginTop: 8}}>
                {optionLines.map((line: string, i: number) => (
                  <DetailField
                    key={i}
                    label="•"
                    value={line}
                    vertical={false}
                  />
                ))}
                <ButtonRow style={{marginTop: 12}}>
                  <Button
                    text="Edit"
                    fullWidth
                    onPress={() => openEditSlot(index)}
                  />
                  <Button
                    text="Delete"
                    fullWidth
                    onPress={() => deleteSlot(index)}
                  />
                </ButtonRow>
              </View>
            ),
          };
        })}
      />
    );
  };

  const renderModalContent = () => {
    if (activeModal === 'type') {
      return (
        <>
          <ScrollView>
            <Title text="Select Exercise Type" />
            <ClickableList
              items={sortedExerciseTypes.map((t: ExerciseType) => ({
                id: t.id,
                label: t.name,
                onPress: () => {
                  setFieldValue('exerciseTypeId', t.id);
                  setActiveModal(null);
                },
              }))}
            />
          </ScrollView>
          <DividerWithLabel label="OR" />
          <Button text="Back" onPress={() => setActiveModal(null)} />
        </>
      );
    }

    if (activeModal === 'difficulty') {
      return (
        <>
          <ScrollView>
            <Title text="Select Difficulty Level" />
            <ClickableList
              items={sortedDifficulties.map((d: ExerciseDifficulty) => ({
                id: d.id,
                label: d.level,
                onPress: () => {
                  setFieldValue('difficultyId', d.id);
                  setActiveModal(null);
                },
              }))}
            />
          </ScrollView>
          <DividerWithLabel label="OR" />
          <Button text="Back" onPress={() => setActiveModal(null)} />
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
            <ScrollView>
              <Title text="Select Body Part" />
              <ClickableList
                items={sortedBodyParts.map(bp => ({
                  id: bp.id,
                  label: bp.name,
                  onPress: () => {
                    setSelectedBodyPartId(bp.id);
                    setMuscleStep('muscle');
                  },
                }))}
              />
            </ScrollView>
            <DividerWithLabel label="OR" />
            <Button text="Back" onPress={() => setActiveModal(null)} />
          </>
        );
      }

      if (muscleStep === 'muscle' && selectedBodyPartId) {
        return (
          <>
            <ScrollView>
              <Title text="Select Muscles" />
              <ScrollView
                style={{maxHeight: modalHeight - 200}}
                contentContainerStyle={{paddingHorizontal: 16}}>
                <ClickableList
                  items={sortedMuscles
                    .filter((m: Muscle) => m.bodyPart.id === selectedBodyPartId)
                    .map((m: Muscle) => ({
                      id: m.id,
                      label: m.name,
                      selected: selectedMuscleIds.includes(m.id),
                      onPress: () => handleMuscleToggle(m.id, fieldName),
                    }))}
                />
              </ScrollView>
            </ScrollView>
            <DividerWithLabel label="OR" />
            <Button text="Back" onPress={() => setMuscleStep('bodyPart')} />
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
        value={values.name}
        onChangeText={(text: string) => setFieldValue('name', text)}
        placeholder="e.g., Bench Press"
      />

      <FormInput
        label="Description"
        value={values.description}
        onChangeText={(text: string) => setFieldValue('description', text)}
        placeholder="Optional description..."
      />

      <FormInput
        label="Video URL"
        value={values.videoUrl || ''}
        onChangeText={(text: string) =>
          setFieldValue('videoUrl', text || undefined)
        }
        placeholder="https://youtube.com/..."
      />

      <SelectableField
        label="Exercise Type"
        value={
          sortedExerciseTypes.find(
            (t: ExerciseType) => t.id === values.exerciseTypeId,
          )?.name || 'Select Type'
        }
        onPress={() => setActiveModal('type')}
      />

      <SelectableField
        label="Difficulty"
        value={
          sortedDifficulties.find(
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

      <DividerWithLabel label="Equipment Slots" />

      <Button
        text="Add Equipment Slot"
        onPress={() => {
          if ((values.equipmentSlots || []).length >= 5) {
            Toast.show({type: 'error', text1: 'Maximum of 5 slots allowed.'});
            return;
          }
          setSlotEditIndex(null);
          setSlotModalVisible(true);
        }}
      />

      {renderSlotList()}

      <ModalWrapper
        visible={!!activeModal}
        onClose={() => setActiveModal(null)}>
        {renderModalContent()}
      </ModalWrapper>

      <EquipmentSlotModal
        visible={slotModalVisible}
        onClose={() => setSlotModalVisible(false)}
        onSave={saveSlot}
        initialSlotIndex={slotEditIndex ?? (values.equipmentSlots?.length || 0)}
        subcategories={sortedSubcategories.filter(
          sc =>
            !values.equipmentSlots?.some(
              (slot: {options: {subcategoryId: number}[]}) =>
                slot.options.some(
                  (opt: {subcategoryId: number}) => opt.subcategoryId === sc.id,
                ),
            ),
        )}
        subcategoriesFull={sortedSubcategories}
        initialData={
          slotEditIndex !== null
            ? values.equipmentSlots[slotEditIndex]
            : undefined
        }
      />
    </>
  );
}
