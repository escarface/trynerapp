/**
 * Workout Session Store - Global Workout State
 * TrynerApp - Workout Feature
 *
 * Manages the active workout session state across screens.
 *
 * Flow:
 * 1. Configure workout (exercise, sets, reps) → PreWorkoutScreen
 * 2. Execute sets → ActiveWorkoutScreen
 * 3. Complete session → WorkoutSummaryScreen
 * 4. Reset for next workout
 */

import { create } from 'zustand';
import { DetectedRep } from '@/motion-engine';

// ============= TYPES =============

export interface WorkoutConfig {
  exerciseId: string;
  exerciseName: string;
  totalSets: number;
  targetRepsPerSet: number;
  userId: string;
}

export interface CompletedSet {
  setNumber: number;
  reps: DetectedRep[];
  repsCompleted: number;
  duration: number; // milliseconds
  averageScore: number;
  timestamp: number;
}

interface WorkoutSessionState {
  // Configuration
  config: WorkoutConfig | null;

  // Session state
  isActive: boolean;
  currentSet: number;
  completedSets: CompletedSet[];

  // Session metadata
  sessionId: string | null;
  sessionStartTime: number | null;

  // Actions
  configureWorkout: (config: WorkoutConfig) => void;
  startSession: () => void;
  completeSet: (setData: CompletedSet) => void;
  nextSet: () => void;
  endSession: () => void;
  reset: () => void;

  // Computed getters
  getTotalReps: () => number;
  getSessionDuration: () => number;
  getAverageScore: () => number;
  isSessionComplete: () => boolean;
}

// ============= INITIAL STATE =============

const initialState = {
  config: null,
  isActive: false,
  currentSet: 1,
  completedSets: [],
  sessionId: null,
  sessionStartTime: null,
};

// ============= STORE =============

export const useWorkoutSessionStore = create<WorkoutSessionState>((set, get) => ({
  ...initialState,

  /**
   * Configure workout parameters
   * Called from PreWorkoutScreen before starting
   */
  configureWorkout: (config) => {
    set({
      config,
      currentSet: 1,
      completedSets: [],
    });
  },

  /**
   * Start workout session
   * Generates session ID and records start time
   */
  startSession: () => {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    set({
      isActive: true,
      sessionId,
      sessionStartTime: Date.now(),
      currentSet: 1,
      completedSets: [],
    });
  },

  /**
   * Mark current set as completed
   * Stores set data for later database persistence
   */
  completeSet: (setData) => {
    set((state) => ({
      completedSets: [...state.completedSets, setData],
    }));
  },

  /**
   * Move to next set
   * Increments current set number
   */
  nextSet: () => {
    set((state) => ({
      currentSet: state.currentSet + 1,
    }));
  },

  /**
   * End entire workout session
   * Marks session as inactive (data persists for summary screen)
   */
  endSession: () => {
    set({
      isActive: false,
    });
  },

  /**
   * Reset store to initial state
   * Called after viewing summary or canceling workout
   */
  reset: () => {
    set(initialState);
  },

  /**
   * Get total reps across all completed sets
   */
  getTotalReps: () => {
    const { completedSets } = get();
    return completedSets.reduce((total, set) => total + set.repsCompleted, 0);
  },

  /**
   * Get session duration in milliseconds
   */
  getSessionDuration: () => {
    const { sessionStartTime, isActive } = get();
    if (!sessionStartTime) return 0;

    const endTime = isActive ? Date.now() : sessionStartTime;
    return endTime - sessionStartTime;
  },

  /**
   * Get average score across all completed sets
   */
  getAverageScore: () => {
    const { completedSets } = get();
    if (completedSets.length === 0) return 0;

    const totalScore = completedSets.reduce((sum, set) => sum + set.averageScore, 0);
    return Math.round(totalScore / completedSets.length);
  },

  /**
   * Check if all sets are completed
   */
  isSessionComplete: () => {
    const { config, completedSets } = get();
    if (!config) return false;
    return completedSets.length >= config.totalSets;
  },
}));
