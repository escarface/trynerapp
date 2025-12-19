export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  age?: number;
  weight?: number;
  height?: number;
  fitness_level?: 'beginner' | 'intermediate' | 'advanced';
  goal?: 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'general_health';
  created_at: number;
  updated_at: number;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscle_group: string;
  difficulty: string;
  sensor_profile: string;
  created_at: number;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  started_at: number;
  ended_at?: number;
  total_score?: number;
}

export interface ExerciseSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps_completed?: number;
  target_reps?: number;
  duration?: number;
  score?: number;
  stability_score?: number;
  range_score?: number;
  consistency_score?: number;
  raw_data?: string;
  created_at: number;
}

// Helper type for creating users (without generated fields)
export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  age?: number;
  weight?: number;
  height?: number;
  fitness_level?: User['fitness_level'];
  goal?: User['goal'];
}
