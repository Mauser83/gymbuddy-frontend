import {ExerciseGroup} from '../types/plan.types';

export function getGroupLabel(
  group: ExerciseGroup,
  getMethodById: (id: number) => any,
): string {
  const method = getMethodById(group.trainingMethodId);
  if (!method) return 'Unnamed Group';
  const range =
    method.minGroupSize === method.maxGroupSize
      ? `${method.minGroupSize}`
      : `${method.minGroupSize ?? 1}–${method.maxGroupSize ?? '∞'}`;
  return `${method.name} (${range})`;
}

export function getGroupLabelById(
  groupId: number,
  groups: ExerciseGroup[],
  getMethodById: (id: number) => any,
): string {
  const group = groups.find(g => g.id === groupId);
  return group ? getGroupLabel(group, getMethodById) : 'None';
}