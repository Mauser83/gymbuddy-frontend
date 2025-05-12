export interface Exercise {
  id: number;
  name: string;
  muscleGroup: string;
  equipment: string;
  instructions: string;
}

export interface ExercisesResponse {
  exercises: Exercise[];
}