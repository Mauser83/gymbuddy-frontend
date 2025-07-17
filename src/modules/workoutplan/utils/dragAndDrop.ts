import {Alert} from 'react-native';
import {DragData} from 'shared/dragAndDrop/DraggableItem';
import {Layout} from 'shared/dragAndDrop/MeasureDraggableItem';
import Animated from 'react-native-reanimated';
import {
  ExerciseFormEntry,
  ExerciseGroup,
  FormValues,
  PlanItem,
} from '../types/plan.types';

export const GAP_TRIGGER_THRESHOLD = 0.5;
export const MIN_DROP_GAP_PX = 30;

export const isPointInLayout = (
  pointX: number,
  pointY: number,
  layout: Layout,
) => {
  return (
    pointX >= layout.x &&
    pointX <= layout.x + layout.width &&
    pointY >= layout.y &&
    pointY <= layout.y + layout.height
  );
};

export const getPlanItemsFromForm = (values: FormValues): PlanItem[] => {
  const items: PlanItem[] = [];
  for (const group of values.groups) {
    items.push({type: 'group', data: group});
  }
  for (const ex of values.exercises.filter(e => e.groupId == null)) {
    items.push({type: 'exercise', data: ex});
  }
  return items.sort((a, b) => a.data.order - b.data.order);
};

export const getNextGlobalOrder = (
  exs: ExerciseFormEntry[],
  grps: ExerciseGroup[],
): number => {
  const orders = [...exs.map(e => e.order ?? 0), ...grps.map(g => g.order ?? 0)];
  return orders.length > 0 ? Math.max(...orders) + 1 : 0;
};

export const reindexAllOrders = (
  exs: ExerciseFormEntry[],
  grps: ExerciseGroup[],
): {exercises: ExerciseFormEntry[]; groups: ExerciseGroup[]} => {
  const items: PlanItem[] = [
    ...grps.map(g => ({type: 'group' as const, data: g})),
    ...exs.map(e => ({type: 'exercise' as const, data: e})),
  ];
  items.sort((a, b) => a.data.order - b.data.order);

  const newExercises = [...exs];
  const newGroups = [...grps];

  items.forEach((it, idx) => {
    if (it.type === 'exercise') {
      const exIdx = newExercises.findIndex(e => e.instanceId === it.data.instanceId);
      if (exIdx !== -1) newExercises[exIdx].order = idx;
    } else {
      const gIdx = newGroups.findIndex(g => g.id === it.data.id);
      if (gIdx !== -1) newGroups[gIdx].order = idx;
    }
  });

  return {exercises: newExercises, groups: newGroups};
};

export const updateExerciseGroup = (
  instanceId: string,
  groupId: number | null,
  currentExercises: ExerciseFormEntry[],
  currentGroups: ExerciseGroup[],
  getMethodById: (id: number) => {maxGroupSize?: number} | undefined,
): {exercises: ExerciseFormEntry[]; groups: ExerciseGroup[]} | undefined => {
  const exerciseIndex = currentExercises.findIndex(ex => ex.instanceId === instanceId);
  if (exerciseIndex === -1) return;

  const updatedExercises = [...currentExercises];
  const updatedGroups = [...currentGroups];

  if (groupId !== null) {
    const group = updatedGroups.find(g => g.id === groupId);
    if (!group) return;

    const method = getMethodById(group.trainingMethodId);
    const max = method?.maxGroupSize;
    const exercisesInGroup = updatedExercises.filter(e => e.groupId === groupId);

    if (max != null && exercisesInGroup.length >= max) {
      Alert.alert('Group Limit Reached', `You can only add ${max} exercises to this group.`);
      return;
    }

    const newTrainingMethodId = group.trainingMethodId ?? null;

    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      groupId,
      trainingMethodId: newTrainingMethodId,
      order: group.order + 0.1,
    };

    exercisesInGroup.sort((a, b) => a.order - b.order).forEach((ex, idx) => {
      const originalExIndex = updatedExercises.findIndex(e => e.instanceId === ex.instanceId);
      if (originalExIndex !== -1) {
        updatedExercises[originalExIndex].order = group.order + 0.2 + idx * 0.1;
      }
    });
  } else {
    const oldGroupId = updatedExercises[exerciseIndex].groupId;
    if (oldGroupId === null) return;

    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      groupId: null,
      trainingMethodId: null,
      order: getNextGlobalOrder(updatedExercises, updatedGroups),
    };
  }

  return reindexAllOrders(updatedExercises, updatedGroups);
};

export const reorderExercises = (
  draggedId: string,
  targetId: string,
  position: 'before' | 'after',
  currentExercises: ExerciseFormEntry[],
  currentGroups: ExerciseGroup[],
): {exercises: ExerciseFormEntry[]; groups: ExerciseGroup[]} => {
  const draggedItem = currentExercises.find(ex => ex.instanceId === draggedId);
  const targetItem = currentExercises.find(ex => ex.instanceId === targetId);
  if (!draggedItem || !targetItem) return {exercises: currentExercises, groups: currentGroups};

  if (draggedItem.groupId !== targetItem.groupId) {
    console.warn('Attempted to reorder exercises across different groups.');
    return {exercises: currentExercises, groups: currentGroups};
  }

  const containerExercises = currentExercises
    .filter(ex => ex.groupId === draggedItem.groupId)
    .sort((a, b) => a.order - b.order);

  let fromIdx = containerExercises.findIndex(ex => ex.instanceId === draggedId);
  let targetIdx = containerExercises.findIndex(ex => ex.instanceId === targetId);
  if (fromIdx === -1 || targetIdx === -1)
    return {exercises: currentExercises, groups: currentGroups};

  const [moved] = containerExercises.splice(fromIdx, 1);

  if (fromIdx < targetIdx) {
    targetIdx--;
  }

  let insertIdx = targetIdx;
  if (position === 'after') {
    insertIdx = targetIdx + 1;
  }

  containerExercises.splice(insertIdx, 0, moved);

  const updatedExercises = currentExercises.map(ex => {
    const idx = containerExercises.findIndex(ce => ce.instanceId === ex.instanceId);
    if (idx !== -1) {
      return {...ex, order: idx};
    }
    return ex;
  });

  return reindexAllOrders(updatedExercises, currentGroups);
};

export const reorderPlanItems = (
  dragged: DragData,
  target: DragData,
  position: 'before' | 'after',
  currentValues: FormValues,
): {exercises: ExerciseFormEntry[]; groups: ExerciseGroup[]} => {
  const items = getPlanItemsFromForm(currentValues);
  const draggedIndex = items.findIndex(i => {
    if (i.type !== dragged.type) return false;
    return i.type === 'exercise'
      ? i.data.instanceId === dragged.id
      : String(i.data.id) === dragged.id;
  });
  let targetIndex = items.findIndex(i => {
    if (i.type !== target.type) return false;
    return i.type === 'exercise'
      ? i.data.instanceId === target.id
      : String(i.data.id) === target.id;
  });

  if (draggedIndex === -1 || targetIndex === -1)
    return {exercises: currentValues.exercises, groups: currentValues.groups};

  const newItems = [...items];
  const [moved] = newItems.splice(draggedIndex, 1);

  if (draggedIndex < targetIndex) {
    targetIndex--;
  }

  let finalIndex = targetIndex;
  if (position === 'after') {
    finalIndex = targetIndex + 1;
  }

  newItems.splice(finalIndex, 0, moved);

  const newExercises = [...currentValues.exercises];
  const newGroups = [...currentValues.groups];

  newItems.forEach((it, idx) => {
    if (it.type === 'exercise') {
      const exIdx = newExercises.findIndex(e => e.instanceId === it.data.instanceId);
      if (exIdx !== -1) newExercises[exIdx].order = idx;
    } else {
      const gIdx = newGroups.findIndex(g => g.id === it.data.id);
      if (gIdx !== -1) newGroups[gIdx].order = idx;
    }
  });

  return {exercises: newExercises, groups: newGroups};
};

type ContainerItem = {id: string; layout: Layout; type: 'group' | 'exercise'};

export const buildContainerItemsForDrag = (
  draggedItemData: DragData,
  currentValues: FormValues,
  pointerY: number | null,
  includePlaceholder: boolean,
  originalGroupId: number | null,
  groupLayouts: Record<number, Layout>,
  exerciseLayouts: Record<string, Layout>,
): {
  items: ContainerItem[];
  fromIdx: number;
  wasOriginallyOutside: boolean;
  originalDragDirection: 'up' | 'down' | null;
} | null => {
  const draggedKey =
    draggedItemData.type === 'group'
      ? String(draggedItemData.id)
      : draggedItemData.id;

  const containerItems: ContainerItem[] = [];

  const draggedItem = currentValues.exercises.find(e => e.instanceId === draggedItemData.id);

  const isPointerOverAnyGroup =
    pointerY != null
      ? Object.values(groupLayouts).some(l => pointerY >= l.y && pointerY <= l.y + l.height)
      : false;

  const treatAsTopLevelDrag =
    draggedItemData.type === 'group' ||
    (draggedItemData.type === 'exercise' &&
      (pointerY == null ? draggedItem?.groupId == null : draggedItem?.groupId == null || !isPointerOverAnyGroup));

  if (treatAsTopLevelDrag) {
    for (const id in exerciseLayouts) {
      const ex = currentValues.exercises.find(e => e.instanceId === id);
      if (ex && ex.groupId == null && exerciseLayouts[id]) {
        containerItems.push({id, layout: exerciseLayouts[id], type: 'exercise'});
      }
    }
    for (const id in groupLayouts) {
      const groupFound = currentValues.groups.find(g => String(g.id) === id);
      if (groupFound && groupLayouts[id]) {
        containerItems.push({id: String(id), layout: groupLayouts[id], type: 'group'});
      }
    }
  } else {
    if (!draggedItem) return null;
    const groupId = draggedItem.groupId;
    if (groupId != null) {
      const groupLayout = groupLayouts[groupId];
      if (groupLayout) {
        containerItems.push({id: String(groupId), layout: groupLayout, type: 'group'});
      }
      const exs = currentValues.exercises
        .filter(ex => ex.groupId === groupId)
        .sort((a, b) => a.order - b.order);
      exs.forEach(ex => {
        const layout = exerciseLayouts[ex.instanceId];
        if (layout) containerItems.push({id: ex.instanceId, layout, type: 'exercise'});
      });
    }
  }

  containerItems.sort((a, b) => a.layout.y - b.layout.y);

  let fromIdx = containerItems.findIndex(it => it.id === draggedKey);
  let wasOriginallyOutside = false;
  let originalDragDirection: 'up' | 'down' | null = null;

  if (includePlaceholder && fromIdx === -1 && pointerY != null && draggedItemData.type === 'exercise') {
    const baseLayout = exerciseLayouts[draggedKey];
    if (baseLayout) {
      wasOriginallyOutside = true;

      if (originalGroupId != null) {
        const originalLayout = groupLayouts[originalGroupId];
        if (originalLayout) {
          if (pointerY < originalLayout.y) {
            originalDragDirection = 'up';
          } else if (pointerY > originalLayout.y + originalLayout.height) {
            originalDragDirection = 'down';
          }
        }
      }

      const newItem = {id: draggedKey, layout: {...baseLayout, y: pointerY}, type: 'exercise' as const};

      let inserted = false;
      for (let i = 0; i < containerItems.length; i++) {
        if (pointerY < containerItems[i].layout.y) {
          containerItems.splice(i, 0, newItem);
          inserted = true;
          break;
        }
      }
      if (!inserted) containerItems.push(newItem);

      containerItems.sort((a, b) => a.layout.y - b.layout.y);
      fromIdx = containerItems.findIndex(it => it.id === draggedKey);
    }
  }

  return {items: containerItems, fromIdx, wasOriginallyOutside, originalDragDirection};
};

export const calculateDropTarget = (
  x: number,
  y: number,
  draggedItemData: DragData,
  currentValues: FormValues,
  groupLayouts: Record<number, Layout>,
  exerciseLayouts: Record<string, Layout>,
): {target: DragData; position: 'before' | 'after'} | null => {
  const result = buildContainerItemsForDrag(
    draggedItemData,
    currentValues,
    null,
    false,
    null,
    groupLayouts,
    exerciseLayouts,
  );
  if (!result) return null;
  const {items: containerItems, fromIdx} = result;
  const draggedKey =
    draggedItemData.type === 'group' ? String(draggedItemData.id) : draggedItemData.id;

  let finalTargetIdx = fromIdx;
  let finalPreviewPosition: 'before' | 'after' = 'after';

  const GROUP_SHRINK_VERTICAL_OFFSET = 30;

  for (let i = 0; i < containerItems.length; i++) {
    const item = containerItems[i];
    const originalItemLayout = {...item.layout};
    let currentItemLayout = {...item.layout};

    if (i < containerItems.length - 1 && item.type === 'group') {
      const nextItem = containerItems[i + 1];
      const nextTop = nextItem.layout.y;
      if (y >= nextTop && y < nextTop + MIN_DROP_GAP_PX) {
        finalTargetIdx = i;
        finalPreviewPosition = 'after';
        break;
      }
    }

    if (item.type === 'group') {
      currentItemLayout.y += GROUP_SHRINK_VERTICAL_OFFSET;
      currentItemLayout.height -= GROUP_SHRINK_VERTICAL_OFFSET * 3;
      if (currentItemLayout.height < 0) currentItemLayout.height = 0;
    }

    if (item.id === draggedKey) continue;

    const itemMidpointY = currentItemLayout.y + currentItemLayout.height / 2;
    const beforeThreshold = currentItemLayout.y + currentItemLayout.height * 0.2;
    const afterThreshold = currentItemLayout.y + currentItemLayout.height * 0.8;

    if (y >= currentItemLayout.y && y <= currentItemLayout.y + currentItemLayout.height) {
      finalTargetIdx = i;
      if (y < beforeThreshold) {
        finalPreviewPosition = 'before';
      } else if (y > afterThreshold) {
        finalPreviewPosition = 'after';
      } else {
        finalPreviewPosition = y < itemMidpointY ? 'before' : 'after';
      }
      break;
    } else if (i < containerItems.length - 1) {
      const nextItem = containerItems[i + 1];
      const originalNextItemLayout = {...nextItem.layout};
      let nextItemLayout = {...nextItem.layout};
      if (nextItem.type === 'group') {
        nextItemLayout.y += GROUP_SHRINK_VERTICAL_OFFSET;
        nextItemLayout.height -= GROUP_SHRINK_VERTICAL_OFFSET * 2;
        if (nextItemLayout.height < 0) nextItemLayout.height = 0;
      }

      const gapStart = originalItemLayout.y + originalItemLayout.height;
      let gapEnd = nextItemLayout.y;
      if (item.type === 'group' && gapEnd - gapStart < MIN_DROP_GAP_PX) {
        gapEnd = gapStart + MIN_DROP_GAP_PX;
      }
      const earlyTriggerThreshold = GAP_TRIGGER_THRESHOLD;
      const triggerPointInGap = gapStart + (gapEnd - gapStart) * earlyTriggerThreshold;

      if (item.type === 'group') {
        if (y >= originalNextItemLayout.y && y < originalNextItemLayout.y + MIN_DROP_GAP_PX) {
          finalTargetIdx = i;
          finalPreviewPosition = 'after';
          break;
        }
      }

      if (y > gapStart && y < gapEnd) {
        if (y < triggerPointInGap) {
          finalTargetIdx = i;
          finalPreviewPosition = 'after';
          break;
        } else {
          finalTargetIdx = i + 1;
          finalPreviewPosition = 'before';
          break;
        }
      }
    } else if (i === containerItems.length - 1 && y > currentItemLayout.y + currentItemLayout.height) {
      finalTargetIdx = containerItems.length - 1;
      finalPreviewPosition = 'after';
      break;
    }
  }

  const targetItem = containerItems[finalTargetIdx];
  if (!targetItem || targetItem.id === draggedKey) return null;

  return {target: {type: targetItem.type, id: targetItem.id}, position: finalPreviewPosition};
};

export const updatePreviewOffsets = (
  x: number,
  y: number,
  draggedItemData: DragData,
  values: FormValues,
  groupLayouts: Record<number, Layout>,
  exerciseLayouts: Record<string, Layout>,
  dragOffsets: Record<string, Animated.SharedValue<number>>,
  draggedItemOriginalGroupId: number | null,
): void => {
  const result = buildContainerItemsForDrag(
    draggedItemData,
    values,
    y,
    true,
    draggedItemOriginalGroupId,
    groupLayouts,
    exerciseLayouts,
  );
  if (!result) return;
  const {items: containerItems, fromIdx, wasOriginallyOutside, originalDragDirection} = result;
  const draggedKey =
    draggedItemData.type === 'group' ? String(draggedItemData.id) : draggedItemData.id;

  containerItems.forEach(item => {
    if (dragOffsets[item.id]) {
      dragOffsets[item.id].value = 0;
    }
  });

  let finalTargetIdx = fromIdx;
  let finalPreviewPosition: 'before' | 'after' = 'before';

  const GROUP_SHRINK_VERTICAL_OFFSET = 30;

  for (let i = 0; i < containerItems.length; i++) {
    const item = containerItems[i];
    const originalItemLayout = {...item.layout};
    let currentItemLayout = {...item.layout};

    if (i < containerItems.length - 1 && item.type === 'group') {
      const nextItem = containerItems[i + 1];
      const nextTop = nextItem.layout.y;
      if (y >= nextTop && y < nextTop + MIN_DROP_GAP_PX) {
        finalTargetIdx = i;
        finalPreviewPosition = 'after';
        break;
      }
    }

    if (item.type === 'group') {
      currentItemLayout.y += GROUP_SHRINK_VERTICAL_OFFSET;
      currentItemLayout.height -= GROUP_SHRINK_VERTICAL_OFFSET * 2.2;
      if (currentItemLayout.height < 0) currentItemLayout.height = 0;
    }

    if (item.type === 'group') {
      if (
        draggedItemData.type === 'exercise' &&
        y >= item.layout.y &&
        y <= item.layout.y + item.layout.height
      ) {
        return;
      }
    }

    const itemMidpointY = currentItemLayout.y + currentItemLayout.height / 2;
    const beforeThreshold = currentItemLayout.y + currentItemLayout.height * 0.2;
    const afterThreshold = currentItemLayout.y + currentItemLayout.height * 0.8;

    if (y >= currentItemLayout.y && y <= currentItemLayout.y + currentItemLayout.height) {
      finalTargetIdx = i;
      if (y < beforeThreshold) {
        finalPreviewPosition = 'before';
      } else if (y > afterThreshold) {
        finalPreviewPosition = 'after';
      } else {
        finalPreviewPosition = y < itemMidpointY ? 'before' : 'after';
      }
      break;
    } else if (i < containerItems.length - 1) {
      const nextItem = containerItems[i + 1];
      const originalNextItemLayout = {...nextItem.layout};
      let nextItemLayout = {...nextItem.layout};
      if (nextItem.type === 'group') {
        nextItemLayout.y += GROUP_SHRINK_VERTICAL_OFFSET;
        nextItemLayout.height -= GROUP_SHRINK_VERTICAL_OFFSET * 2;
        if (nextItemLayout.height < 0) nextItemLayout.height = 0;
      }

      const gapStart = originalItemLayout.y + originalItemLayout.height;
      let gapEnd = nextItemLayout.y;
      if (item.type === 'group' && gapEnd - gapStart < MIN_DROP_GAP_PX) {
        gapEnd = gapStart + MIN_DROP_GAP_PX;
      }
      const earlyTriggerThreshold = GAP_TRIGGER_THRESHOLD;
      const triggerPointInGap = gapStart + (gapEnd - gapStart) * earlyTriggerThreshold;

      if (item.type === 'group') {
        if (y >= originalNextItemLayout.y && y < originalNextItemLayout.y + MIN_DROP_GAP_PX) {
          finalTargetIdx = i;
          finalPreviewPosition = 'after';
          break;
        }
      }

      if (y > gapStart && y < gapEnd) {
        if (y < triggerPointInGap) {
          finalTargetIdx = i;
          finalPreviewPosition = 'after';
          break;
        } else {
          finalTargetIdx = i + 1;
          finalPreviewPosition = 'before';
          break;
        }
      }
    } else if (i === containerItems.length - 1 && y > currentItemLayout.y + currentItemLayout.height) {
      finalTargetIdx = containerItems.length;
      finalPreviewPosition = 'after';
      break;
    }
  }

  let effectiveInsertionIndex = finalTargetIdx;
  if (finalPreviewPosition === 'after') {
    effectiveInsertionIndex = finalTargetIdx + 1;
  }
  effectiveInsertionIndex = Math.max(0, Math.min(effectiveInsertionIndex, containerItems.length));

  const baseHeight = exerciseLayouts[draggedKey]?.height ?? 82;
  const draggedItemHeight = fromIdx >= 0 ? containerItems[fromIdx].layout.height : baseHeight;
  if (wasOriginallyOutside) {
    if (originalDragDirection === 'down') {
      for (let i = 0; i < containerItems.length; i++) {
        const item = containerItems[i];
        if (item.id === draggedKey) {
          continue;
        }
        if (i >= effectiveInsertionIndex) {
          if (dragOffsets[item.id]) {
            dragOffsets[item.id].value = draggedItemHeight;
          }
        }
      }
    } else if (originalDragDirection === 'up') {
      for (let i = 0; i < containerItems.length; i++) {
        const item = containerItems[i];
        if (String(item.id) === String(draggedKey)) {
          dragOffsets[draggedKey].value = -draggedItemHeight;
          continue;
        }
        if (i >= effectiveInsertionIndex) {
          if (item.id !== draggedKey && dragOffsets[item.id]) {
            dragOffsets[item.id].value = draggedItemHeight;
          }
        }
      }
    }
  } else {
    if (effectiveInsertionIndex < fromIdx) {
      for (let i = 0; i < containerItems.length; i++) {
        const item = containerItems[i];
        if (item.id === draggedKey) {
          continue;
        }
        if (i >= effectiveInsertionIndex && i < fromIdx) {
          if (dragOffsets[item.id]) {
            dragOffsets[item.id].value = draggedItemHeight;
          }
        }
      }
    } else if (effectiveInsertionIndex > fromIdx) {
      for (let i = 0; i < containerItems.length; i++) {
        const item = containerItems[i];
        if (item.id === draggedKey) {
          continue;
        }
        if (i > fromIdx && i < effectiveInsertionIndex) {
          if (dragOffsets[item.id]) {
            dragOffsets[item.id].value = -draggedItemHeight;
          }
        }
      }
    }
    if (dragOffsets[draggedKey]) {
      dragOffsets[draggedKey].value = 0;
    }
  }
};