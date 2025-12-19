/**
 * SQLite Database Schema for TrynerApp MVP
 */

export const SCHEMA_VERSION = 1;

export const createTablesSQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  age INTEGER,
  weight REAL,
  height REAL,
  fitness_level TEXT,
  goal TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  muscle_group TEXT,
  difficulty TEXT,
  sensor_profile TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Workout sessions table
CREATE TABLE IF NOT EXISTS workout_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  total_score REAL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Exercise sets table
CREATE TABLE IF NOT EXISTS exercise_sets (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  reps_completed INTEGER,
  target_reps INTEGER,
  duration REAL,
  score REAL,
  stability_score REAL,
  range_score REAL,
  consistency_score REAL,
  raw_data TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES workout_sessions(id),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_session_id ON exercise_sets(session_id);
`;

export const seedDataSQL = `
-- Seed initial exercise: Sentadillas
INSERT OR IGNORE INTO exercises (id, name, description, muscle_group, difficulty, sensor_profile, created_at)
VALUES (
  'squat-001',
  'Sentadillas',
  'Ejercicio fundamental para piernas y glúteos. Fortalece cuádriceps, isquiotibiales y glúteos.',
  'Piernas',
  'Principiante',
  'squat',
  ${Date.now()}
);
`;
