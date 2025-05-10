export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  instructions: string;
}

export interface ExercisesResponse {
  exercises: Exercise[];
}