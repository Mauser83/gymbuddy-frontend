export type ExerciseFormEntry = {
  instanceId: string;
  exerciseId: number;
  exerciseName: string;
  targetSets: number;
  targetMetrics: {
    metricId: number;
    min: number | string;
    max?: number | string;
  }[];
  isWarmup: boolean;
  trainingMethodId?: number | null;
  groupId?: number | null;
  order: number;
};

export type ExerciseGroup = {
  id: number;
  trainingMethodId: number;
  order: number;
};

export type FormValues = {
  name: string;
  trainingGoalId: number;
  intensityPresetId: number;
  experienceLevelId?: number | null;
  muscleGroupIds: number[];
  exercises: ExerciseFormEntry[];
  groups: ExerciseGroup[];
};

export type PlanItem =
  | {type: 'exercise'; data: ExerciseFormEntry}
  | {type: 'group'; data: ExerciseGroup};
