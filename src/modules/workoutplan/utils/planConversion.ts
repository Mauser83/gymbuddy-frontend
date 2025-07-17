import {ExerciseFormEntry, ExerciseGroup, FormValues} from '../types/plan.types';
import {generateId} from 'shared/utils/helpers';

export function convertPlanToInitialValues(
  plan: any,
  createPlanningTargetMetrics: (
    exerciseId: number,
  ) => { metricId: number; min: string | number; max?: string | number }[],
): FormValues {  const isFromSession = plan.isFromSession;

  function deriveGroupsFromExercises(
    exercises: ExerciseFormEntry[],
  ): ExerciseGroup[] {
    const seen = new Map<string, ExerciseGroup>();
    for (const ex of exercises) {
      if (ex.groupId != null && ex.trainingMethodId != null) {
        const key = `${ex.groupId}-${ex.trainingMethodId}`;
        if (!seen.has(key)) {
          seen.set(key, {
            id: ex.groupId,
            trainingMethodId: ex.trainingMethodId,
            order: 0,
          });
        }
      }
    }
    return Array.from(seen.values()).map((g, idx) => ({...g, order: idx}));
  }

  if (isFromSession) {
    const exercises = plan.exercises.map((ex: any, idx: number) => ({
      instanceId: ex.instanceId || generateId(),
      exerciseId: ex.exerciseId ?? ex.exercise.id,
      exerciseName: ex.exerciseName ?? ex.exercise.name,
      targetSets: ex.targetSets,
      targetMetrics: ex.targetMetrics?.length
        ? ex.targetMetrics
        : createPlanningTargetMetrics(ex.exerciseId ?? ex.exercise.id),
      trainingMethodId: ex.trainingMethodId ?? ex.trainingMethod?.id ?? null,
      groupId: ex.groupId ?? null,
      isWarmup: ex.isWarmup ?? false,
      order: ex.order ?? idx,
    }));

    return {
      name: plan.name,
      trainingGoalId: plan.trainingGoal?.id,
      intensityPresetId: plan.intensityPreset?.id ?? undefined,
      experienceLevel: plan.intensityPreset?.experienceLevel ?? undefined,
      muscleGroupIds: [],
      exercises,
      groups:
        plan.groups?.map((g: any) => ({
          id: g.id,
          trainingMethodId: g.trainingMethodId,
          order: g.order,
        })) ?? deriveGroupsFromExercises(exercises),
    };
  }

  const exercises = plan.exercises.map((ex: any, idx: number) => ({
    instanceId: ex.instanceId || generateId(),
    exerciseId: ex.exerciseId,
    exerciseName: ex.exerciseName,
    targetSets: ex.targetSets,
    targetMetrics: ex.targetMetrics ?? createPlanningTargetMetrics(ex.exerciseId),
    trainingMethodId: ex.trainingMethodId ?? null,
    groupId: ex.groupId ?? null,
    isWarmup: ex.isWarmup ?? false,
    order: ex.order ?? idx,
  }));

  return {
    name: plan.name,
    trainingGoalId: plan.trainingGoal?.id,
    intensityPresetId: plan.intensityPreset?.id ?? undefined,
    experienceLevel: plan.intensityPreset?.experienceLevel ?? undefined,
    muscleGroupIds: plan.muscleGroups.map((mg: any) => mg.id),
    exercises,
    groups:
      plan.groups?.map((g: any) => ({
        id: g.id,
        trainingMethodId: g.trainingMethodId,
        order: g.order,
      })) ?? deriveGroupsFromExercises(exercises),
  };
}