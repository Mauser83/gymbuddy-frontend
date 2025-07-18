import {useRef, useCallback} from 'react';
import {Platform} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import Animated, {type AnimatedRef} from 'react-native-reanimated';
import type {DragData} from 'shared/dragAndDrop/DraggableItem';
import {Layout} from 'shared/dragAndDrop/MeasureDraggableItem';
import {
  getPlanItemsFromForm,
  isPointInLayout,
  updateExerciseGroup,
  reorderExercises,
  reorderPlanItems,
  calculateDropTarget,
} from '../utils/dragAndDrop';
import type {FormValues, ExerciseGroup} from '../types/plan.types';

type Params = {
  valuesRef: React.MutableRefObject<FormValues>;
  reMeasureAllItems: () => void;
  dragOffsets: React.MutableRefObject<Record<string, Animated.SharedValue<number>>>;
  scrollRef: AnimatedRef<ScrollView>;
  isDraggingItem: React.MutableRefObject<boolean>;
  draggedItemOriginalGroupId: Animated.SharedValue<number | null>;
  draggedItemOriginalIndex: Animated.SharedValue<number | null>;
};

export function usePlanDragAndDrop({
  valuesRef,
  reMeasureAllItems,
  dragOffsets,
  scrollRef,
  isDraggingItem,
  draggedItemOriginalGroupId,
  draggedItemOriginalIndex,
}: Params) {
  const groupLayouts = useRef<Record<number, Layout>>({});
  const exerciseLayouts = useRef<Record<string, Layout>>({});

  const resetPreviewOffsets = useCallback(() => {
    for (const key in dragOffsets.current) {
      dragOffsets.current[key].value = 0;
    }
  }, [dragOffsets]);

  const handleDragStart = useCallback(
    (draggedData: DragData) => {
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
            .map(item => item.data as ExerciseGroup);
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
    },
    [
      valuesRef,
      reMeasureAllItems,
      scrollRef,
      resetPreviewOffsets,
      isDraggingItem,
      draggedItemOriginalGroupId,
      draggedItemOriginalIndex,
    ],
  );

  const handleDrop = useCallback(
    (
      x: number,
      y: number,
      draggedItemData: DragData,
      values: FormValues,
      setFieldValue: (field: string, value: any) => void,
      getMethodById: (id: number) => any,
      handleDragEnd: () => void,
    ) => {
      let droppedHandled = false;
      let currentVals: FormValues = values;

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
            if (isPointInLayout(x, y, adjustedLayout)) {
              const targetGroupId = parseInt(groupIdStr, 10);
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
                break;
              }
            }
          }
        }
      }

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

      if (!droppedHandled && draggedItemData.type === 'exercise') {
        const draggedItem = currentVals.exercises.find(
          ex => ex.instanceId === draggedItemData.id,
        );
        if (draggedItem && draggedItem.groupId !== null) {
          const res = updateExerciseGroup(
            draggedItemData.id,
            null,
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

      handleDragEnd();
    },
    [dragOffsets, groupLayouts, exerciseLayouts],
  );

  return {
    groupLayouts,
    exerciseLayouts,
    handleDragStart,
    handleDrop,
  };
}