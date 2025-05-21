// userWorkouts.types.ts
export interface ExerciseLog {
  id: number;
  exerciseId: number;
  setNumber: number;
  reps: number;
  weight: number;
  rpe?: number;
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
  workoutSessionById: WorkoutSession;
}
