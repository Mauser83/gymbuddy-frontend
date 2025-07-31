import {ExerciseFormEntry, ExerciseGroup} from '../../../features/workout-plans/types/plan.types';

/**
 * Calculate the next available order index given current exercises and groups.
 */
export const getNextGlobalOrder = (
  exs: ExerciseFormEntry[],
  grps: ExerciseGroup[],
): number => {
  const orders = [...exs.map(e => e.order ?? 0), ...grps.map(g => g.order ?? 0)];
  return orders.length > 0 ? Math.max(...orders) + 1 : 0;
};
