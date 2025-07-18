import {useMemo, useEffect, useRef} from 'react';
import {convertPlanToInitialValues} from '../utils/planConversion';
import type {FormValues} from '../types/plan.types';
import type {MuscleGroupMeta} from '../types/meta.types';

export function useFormInitialValues(
  rawPlan: any,
  workoutMeta: any,
  createPlanningTargetMetrics: (exerciseId: number) => any[],
) {
  const groupIdCounterRef = useRef(1);

  const formInitialValues: FormValues = useMemo(() => {
    const plan = rawPlan
      ? convertPlanToInitialValues(rawPlan, createPlanningTargetMetrics)
      : undefined;

    if (plan && rawPlan.isFromSession && plan.muscleGroupIds.length === 0) {
      const bodyPartIds = rawPlan?.bodyPartIds ?? [];
      const autoDetectedMuscleGroupIds =
        workoutMeta?.getMuscleGroups
          ?.filter((group: MuscleGroupMeta) =>
            group.bodyParts.some((bp: any) => bodyPartIds.includes(bp.id)),
          )
          .map((group: MuscleGroupMeta) => group.id) ?? [];
      plan.muscleGroupIds = autoDetectedMuscleGroupIds;
    }

    return (
      plan ?? {
        name: '',
        trainingGoalId: 0,
        intensityPresetId: 0,
        muscleGroupIds: [],
        exercises: [],
        groups: [],
      }
    );
  }, [rawPlan, workoutMeta?.getMuscleGroups, createPlanningTargetMetrics]);

  useEffect(() => {
    const maxId = formInitialValues.groups.reduce(
      (acc, g) => (g.id > acc ? g.id : acc),
      0,
    );
    if (maxId >= groupIdCounterRef.current) {
      groupIdCounterRef.current = maxId + 1;
    }
  }, [formInitialValues]);

  return {formInitialValues, groupIdCounterRef};
}