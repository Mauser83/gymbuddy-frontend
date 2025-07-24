// userWorkouts.types.ts
export interface ExerciseLog {
  id: number;
  exerciseId: number;
  setNumber: number;
  carouselOrder?: number | null;
  groupKey?: string | null;
  instanceKey?: string | null;
  completedAt?: string | null;
  isAutoFilled?: boolean | null;
  metrics?: Record<number, number | string>; // ✅ new dynamic metrics field
  notes?: string;
  equipmentIds: number[]; // 🆕
}

export interface WorkoutSession {
  id: number;
  startedAt: string;
  endedAt: string | null;
  gym: {
    id: number; // ✅ Add this
    name: string;
  } | null;
  workoutPlan: {
    id: number; // ✅ Add this if needed
    name: string;
  } | null;
  exerciseLogs: ExerciseLog[];
}

export interface WorkoutSessionData {
  workoutSessionById: {
    id: number;
    gym: {
      id: number;
      name: string;
    } | null;
    workoutPlan: {
      id: number;
      name: string;
      exercises: {
        exercise: {
          id: number;
          name: string;
        };
        groupId: number | null;
        trainingMethod: {
          id: number;
          name: string;
        } | null;
        targetSets: number;
        targetMetrics: {
          metricId: number;
          min: number | string;
          max?: number | string | null;
        }[];
      }[];
      groups: {
        id: number;
        order?: number | null;
        trainingMethodId?: number | null;
        trainingMethod?: {
          id: number;
          name: string;
          shouldAlternate?: boolean | null;
        } | null;
      }[];
    } | null;
    exerciseLogs: ExerciseLog[];
  };
}
