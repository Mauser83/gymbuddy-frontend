// src/modules/portals/users/types/userWorkouts.types.ts

export interface EquipmentSlot {
  options: {
    subcategory: {
      id: number;
    };
  }[];
}

export interface ExerciseReference {
  id: number;
  name: string;
  equipmentSlots?: {
    options: {
      subcategory: {
        id: number;
      };
    }[];
  }[];
}

export interface EquipmentReference {
  id: number;
  name: string;
}

export interface ExerciseLogForm {
  exercise: ExerciseReference | null;
  equipment: EquipmentReference | null;
  sets: string;
  reps: string;
  weight: string;
  rpe: string;
  notes: string;
}

export interface LogExerciseFormValues {
  workoutPlan: {id: number; name: string} | null;
  gym: {id: number; name: string} | null;
  exercises: ExerciseLogForm[];
}
