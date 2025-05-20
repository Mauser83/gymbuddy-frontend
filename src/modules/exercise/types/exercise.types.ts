export interface Exercise {
  id: number;
  name: string;
  description?: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;

  difficulty?: ExerciseDifficulty;
  exerciseType?: ExerciseType;
  primaryMuscles?: Muscle[];
  secondaryMuscles?: Muscle[];
  equipmentSlots?: ExerciseEquipmentSlot[];
}

export interface ExerciseType {
  id: number;
  name: string;
}

export interface ExerciseDifficulty {
  id: number;
  level: string;
}

export interface Muscle {
  id: number;
  name: string;
  bodyPart: BodyPart;
}

export interface BodyPart {
  id: number;
  name: string;
  muscles?: Muscle[];
}

export type ExerciseEquipmentSlot = {
  id: number;
  slotIndex: number;
  isRequired: boolean;
  comment?: string;
  options: ExerciseEquipmentOption[];
};

export type ExerciseEquipmentOption = {
  id: number;
  subcategory: {
    id: number;
    name: string;
    slug: string;
    category: {
      id: number;
      name: string;
    };
  };
};

export interface Equipment {
  id: number;
  name: string;
  brand: string;
  subcategory?: {
    id: number;
    name: string;
  };
}

export interface CreateExerciseInput {
  name: string;
  description?: string;
  videoUrl?: string;
  difficultyId?: number;
  exerciseTypeId?: number;
  primaryMuscleIds: number[];
  secondaryMuscleIds?: number[];
  equipmentSlots: []; // ✅ NEW
}

export interface UpdateExerciseInput {
  name?: string;
  description?: string;
  videoUrl?: string;
  difficultyId?: number;
  exerciseTypeId?: number;
  primaryMuscleIds?: number[];
  secondaryMuscleIds?: number[];
  equipmentSlots?: {
    slotIndex: number;
    isRequired: boolean;
    comment?: string;
    options: {subcategoryId: number}[];
  }[];
}
