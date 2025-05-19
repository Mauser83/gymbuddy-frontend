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
  equipments?: Equipment[];
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

export interface Equipment {
  id: number;
  name: string;
  brand: string;
}

export interface CreateExerciseInput {
  name: string;
  description?: string;
  videoUrl?: string;
  difficultyId?: number;
  exerciseTypeId?: number;
  primaryMuscleIds: number[];
  secondaryMuscleIds?: number[];
}

export interface UpdateExerciseInput {
  name?: string;
  description?: string;
  videoUrl?: string;
  difficultyId?: number;
  exerciseTypeId?: number;
  primaryMuscleIds?: number[];
  secondaryMuscleIds?: number[];
  equipmentIds?: number[];
}
