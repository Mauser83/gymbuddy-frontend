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
  subcategoryId: number;
}

export interface ExerciseSetLog {
  setNumber: number;
  reps: string;
  weight: string;
  rpe: string;
  notes: string;
}

export interface ExerciseLogForm {
  exercise: ExerciseReference | null;
  equipment: EquipmentReference | null;
  sets: ExerciseSetLog[]; // 🔄 changed from string to array of per-set entries
}

export interface LogExerciseFormValues {
  workoutPlan: { id: number; name: string } | null;
  gym: { id: number; name: string } | null;
  exercises: ExerciseLogForm[];
}
