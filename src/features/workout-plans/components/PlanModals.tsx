import React from 'react';

import ModalWrapper from 'src/shared/components/ModalWrapper';
import { generateId } from 'src/shared/utils/helpers';

import DifficultyPickerModal from './DifficultyPickerModal';
import MuscleGroupPickerModal from './MuscleGroupPickerModal';
import SelectExerciseModal from './SelectExerciseModal';
import TrainingGoalPickerModal from './TrainingGoalPickerModal';
import TrainingMethodPicker from './TrainingMethodPicker';
import type { ActiveModal } from '../types/modal.types';
import type { FormValues } from '../types/plan.types';
import { getNextGlobalOrder } from '../utils/dragAndDrop';

interface PlanModalsProps {
  activeModal: ActiveModal;
  setActiveModal: React.Dispatch<React.SetStateAction<ActiveModal>>;
  values: FormValues;
  setFieldValue: (field: string, value: any) => void;
  workoutMeta: any;
  selectedExerciseIndex: number | null;
  setSelectedExerciseIndex: (index: number | null) => void;
  filteredExercises: any[];
  pushRef: React.MutableRefObject<(item: any) => void>;
  stagedGroupId: number | null;
  setStagedGroupId: (id: number | null) => void;
  createPlanningTargetMetrics: (exerciseId: number) => any[];
}

export default function PlanModals({
  activeModal,
  setActiveModal,
  values,
  setFieldValue,
  workoutMeta,
  selectedExerciseIndex,
  setSelectedExerciseIndex,
  filteredExercises,
  pushRef,
  stagedGroupId,
  setStagedGroupId,
  createPlanningTargetMetrics,
}: PlanModalsProps) {
  return (
    <ModalWrapper visible={!!activeModal} onClose={() => setActiveModal(null)}>
      {activeModal === 'trainingGoalPicker' && (
        <TrainingGoalPickerModal
          visible
          trainingGoals={workoutMeta?.getTrainingGoals ?? []}
          selectedId={values.trainingGoalId}
          onSelect={(goalId) => {
            setFieldValue('trainingGoalId', goalId);
            setActiveModal(null);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'difficultyPicker' && (
        <DifficultyPickerModal
          visible
          selectedId={values.experienceLevelId ?? null}
          levels={workoutMeta?.experienceLevels ?? []}
          onSelect={(id) => {
            setFieldValue('experienceLevelId', id);
            setActiveModal(null);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'muscleGroupPicker' && (
        <MuscleGroupPickerModal
          muscleGroups={workoutMeta?.getMuscleGroups ?? []}
          selectedIds={values.muscleGroupIds}
          onChange={(ids: number[]) => setFieldValue('muscleGroupIds', ids)}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'trainingMethodPicker' && (
        <TrainingMethodPicker
          selectedId={
            selectedExerciseIndex !== null
              ? (values.exercises[selectedExerciseIndex]?.trainingMethodId ?? null)
              : null
          }
          trainingMethods={
            workoutMeta?.getTrainingGoals?.find(
              (g: { id: number; trainingMethods: any[] }) => g.id === values.trainingGoalId,
            )?.trainingMethods ?? []
          }
          onSelect={(id) => {
            if (selectedExerciseIndex !== null) {
              setFieldValue(`exercises[${selectedExerciseIndex}].trainingMethodId`, id);
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
          onSelect={(newExercises) => {
            if (!pushRef.current) {
              console.error('[DEBUG] FATAL: pushRef.current is not set!');
              return;
            }
            try {
              newExercises.forEach((e) => {
                const newTargetMetrics = createPlanningTargetMetrics(e.id);
                const getNextOrder = (): number =>
                  getNextGlobalOrder(values.exercises, values.groups);
                const newExerciseObject = {
                  instanceId: generateId(),
                  exerciseId: e.id,
                  exerciseName: e.name,
                  targetSets: 3,
                  targetMetrics: newTargetMetrics,
                  isWarmup: false,
                  trainingMethodId: undefined,
                  groupId: null,
                  order: getNextOrder(),
                };
                pushRef.current(newExerciseObject);
              });
              setActiveModal(null);
              setSelectedExerciseIndex(null);
            } catch (error) {
              console.error('[DEBUG] An error occurred while adding an exercise:', error);
            }
          }}
        />
      )}
      {activeModal === 'groupMethodPicker' && (
        <TrainingMethodPicker
          selectedId={null}
          trainingMethods={
            workoutMeta?.getTrainingMethods?.filter((m: any) => m.minGroupSize != null) ?? []
          }
          onSelect={(id) => {
            if (stagedGroupId != null) {
              const nextOrder = getNextGlobalOrder(values.exercises, values.groups);
              const newGroup = {
                id: stagedGroupId,
                trainingMethodId: id,
                order: nextOrder,
              };
              setFieldValue('groups', [...values.groups, newGroup]);
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
  );
}
