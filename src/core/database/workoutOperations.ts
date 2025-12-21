/**
 * Workout Operations - Database CRUD for Workouts
 * TrynerApp - Core Database
 *
 * Functions to save and retrieve workout data from SQLite.
 *
 * Tables used:
 * - workout_sessions: Overall session metadata
 * - exercise_sets: Individual sets with reps and scores
 */

import * as SQLite from 'expo-sqlite';
import { DetectedRep } from '@/motion-engine';

// Database helper
let db: SQLite.SQLiteDatabase | null = null;

const getDb = (): SQLite.SQLiteDatabase => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

// Set database instance (called from initDatabase)
export const setDatabase = (database: SQLite.SQLiteDatabase): void => {
  db = database;
};

// ============= TYPES =============

export interface WorkoutSession {
  id: string;
  user_id: string;
  started_at: number;
  ended_at: number | null;
  total_score: number | null;
}

export interface ExerciseSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  reps_completed: number | null;
  target_reps: number | null;
  duration: number | null;
  score: number | null;
  stability_score: number | null;
  range_score: number | null;
  consistency_score: number | null;
  raw_data: string | null; // JSON stringified DetectedRep[]
  created_at: number;
}

export interface WorkoutSessionWithSets extends WorkoutSession {
  sets: ExerciseSet[];
  exercise_name?: string;
}

// ============= SESSION OPERATIONS =============

/**
 * Create new workout session
 *
 * @param userId - User ID
 * @param exerciseId - Exercise ID (e.g., 'squat-001')
 * @returns Created session object
 */
export async function createWorkoutSession(
  userId: string,
  exerciseId: string
): Promise<WorkoutSession> {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startedAt = Date.now();

  await getDb().runAsync(
    `INSERT INTO workout_sessions (id, user_id, started_at) VALUES (?, ?, ?)`,
    [sessionId, userId, startedAt]
  );

  return {
    id: sessionId,
    user_id: userId,
    started_at: startedAt,
    ended_at: null,
    total_score: null,
  };
}

/**
 * End workout session with final score
 *
 * @param sessionId - Session ID
 * @param totalScore - Overall session score (0-100)
 */
export async function endWorkoutSession(
  sessionId: string,
  totalScore: number
): Promise<void> {
  const endedAt = Date.now();

  await getDb().runAsync(
    `UPDATE workout_sessions SET ended_at = ?, total_score = ? WHERE id = ?`,
    [endedAt, totalScore, sessionId]
  );
}

/**
 * Get workout session by ID
 *
 * @param sessionId - Session ID
 * @returns Session object or null if not found
 */
export async function getWorkoutSession(sessionId: string): Promise<WorkoutSession | null> {
  const result = await getDb().getFirstAsync<WorkoutSession>(
    `SELECT * FROM workout_sessions WHERE id = ?`,
    [sessionId]
  );

  return result || null;
}

// ============= SET OPERATIONS =============

/**
 * Create exercise set with rep data
 *
 * @param setData - Set data including reps
 */
export async function createExerciseSet(setData: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  repsCompleted: number;
  targetReps: number;
  duration: number;
  score: number;
  stabilityScore: number;
  rangeScore: number;
  consistencyScore: number;
  rawData: DetectedRep[]; // Will be JSON stringified
}): Promise<ExerciseSet> {
  const setId = `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = Date.now();

  // Stringify raw rep data for storage
  const rawDataJson = JSON.stringify(setData.rawData);

  await getDb().runAsync(
    `INSERT INTO exercise_sets (
      id, session_id, exercise_id, set_number, reps_completed, target_reps,
      duration, score, stability_score, range_score, consistency_score,
      raw_data, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      setId,
      setData.sessionId,
      setData.exerciseId,
      setData.setNumber,
      setData.repsCompleted,
      setData.targetReps,
      setData.duration,
      setData.score,
      setData.stabilityScore,
      setData.rangeScore,
      setData.consistencyScore,
      rawDataJson,
      createdAt,
    ]
  );

  return {
    id: setId,
    session_id: setData.sessionId,
    exercise_id: setData.exerciseId,
    set_number: setData.setNumber,
    reps_completed: setData.repsCompleted,
    target_reps: setData.targetReps,
    duration: setData.duration,
    score: setData.score,
    stability_score: setData.stabilityScore,
    range_score: setData.rangeScore,
    consistency_score: setData.consistencyScore,
    raw_data: rawDataJson,
    created_at: createdAt,
  };
}

/**
 * Get all sets for a session
 *
 * @param sessionId - Session ID
 * @returns Array of sets ordered by set_number
 */
export async function getSessionSets(sessionId: string): Promise<ExerciseSet[]> {
  const sets = await getDb().getAllAsync<ExerciseSet>(
    `SELECT * FROM exercise_sets WHERE session_id = ? ORDER BY set_number ASC`,
    [sessionId]
  );

  return sets;
}

// ============= HISTORY OPERATIONS =============

/**
 * Get all workout sessions for a user
 *
 * @param userId - User ID
 * @param limit - Max number of sessions to return (default: 50)
 * @returns Array of sessions ordered by most recent first
 */
export async function getUserWorkouts(
  userId: string,
  limit: number = 50
): Promise<WorkoutSession[]> {
  const sessions = await getDb().getAllAsync<WorkoutSession>(
    `SELECT * FROM workout_sessions
     WHERE user_id = ?
     ORDER BY started_at DESC
     LIMIT ?`,
    [userId, limit]
  );

  return sessions;
}

/**
 * Get complete session details with sets
 *
 * @param sessionId - Session ID
 * @returns Session with sets and exercise info, or null if not found
 */
export async function getSessionDetails(
  sessionId: string
): Promise<WorkoutSessionWithSets | null> {
  // Get session
  const session = await getWorkoutSession(sessionId);
  if (!session) return null;

  // Get sets
  const sets = await getSessionSets(sessionId);

  // Get exercise name (assuming all sets use same exercise)
  let exerciseName: string | undefined;
  if (sets.length > 0) {
    const exercise = await getDb().getFirstAsync<{ name: string }>(
      `SELECT name FROM exercises WHERE id = ?`,
      [sets[0].exercise_id]
    );
    exerciseName = exercise?.name;
  }

  return {
    ...session,
    sets,
    exercise_name: exerciseName,
  };
}

/**
 * Get user's workout history with exercise names
 *
 * @param userId - User ID
 * @param limit - Max number of sessions
 * @returns Sessions with sets and exercise info
 */
export async function getUserWorkoutHistory(
  userId: string,
  limit: number = 20
): Promise<WorkoutSessionWithSets[]> {
  const sessions = await getUserWorkouts(userId, limit);

  // Fetch sets for each session
  const sessionsWithSets = await Promise.all(
    sessions.map(async (session) => {
      const details = await getSessionDetails(session.id);
      return details!;
    })
  );

  return sessionsWithSets.filter((s) => s !== null);
}

// ============= STATS OPERATIONS =============

/**
 * Get user workout statistics
 *
 * @param userId - User ID
 * @returns Aggregate stats
 */
export async function getUserWorkoutStats(userId: string): Promise<{
  totalWorkouts: number;
  totalReps: number;
  averageScore: number;
  totalDuration: number; // milliseconds
}> {
  // Total workouts
  const workoutsResult = await getDb().getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM workout_sessions WHERE user_id = ? AND ended_at IS NOT NULL`,
    [userId]
  );
  const totalWorkouts = workoutsResult?.count || 0;

  // Total reps and average score from sets
  const setsResult = await getDb().getFirstAsync<{
    total_reps: number;
    avg_score: number;
    total_duration: number;
  }>(
    `SELECT
      COALESCE(SUM(es.reps_completed), 0) as total_reps,
      COALESCE(AVG(es.score), 0) as avg_score,
      COALESCE(SUM(es.duration), 0) as total_duration
     FROM exercise_sets es
     JOIN workout_sessions ws ON es.session_id = ws.id
     WHERE ws.user_id = ?`,
    [userId]
  );

  return {
    totalWorkouts,
    totalReps: setsResult?.total_reps || 0,
    averageScore: Math.round(setsResult?.avg_score || 0),
    totalDuration: setsResult?.total_duration || 0,
  };
}

/**
 * Delete workout session and all associated sets
 *
 * @param sessionId - Session ID
 */
export async function deleteWorkoutSession(sessionId: string): Promise<void> {
  // Delete sets first (foreign key constraint)
  await getDb().runAsync(`DELETE FROM exercise_sets WHERE session_id = ?`, [sessionId]);

  // Delete session
  await getDb().runAsync(`DELETE FROM workout_sessions WHERE id = ?`, [sessionId]);
}
