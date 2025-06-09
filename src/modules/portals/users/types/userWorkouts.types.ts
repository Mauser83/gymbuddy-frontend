// userWorkouts.types.ts
export interface ExerciseLog {
  id: number;
  exerciseId: number;
  setNumber: number;
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
        targetSets: number;
        targetMetrics: {
          metricId: number;
          min: number | string;
          max?: number | string | null;
        }[];
      }[];
    } | null;
    exerciseLogs: ExerciseLog[];
  };
}
