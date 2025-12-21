/**
 * useWorkoutSession Hook - Workout Session Management
 * TrynerApp - Motion Engine
 *
 * Manages complete workout session with multiple sets.
 *
 * Features:
 * - Multi-set workout tracking
 * - Rep accumulation per set
 * - Rest period management
 * - Session metrics (total reps, average score, duration)
 * - Data preparation for database storage
 *
 * Usage:
 * ```typescript
 * const {
 *   currentSet,
 *   targetReps,
 *   repCount,
 *   sessionData,
 *   startSet,
 *   completeSet,
 *   endSession,
 * } = useWorkoutSession({
 *   totalSets: 3,
 *   targetRepsPerSet: 10,
 *   exerciseId: 'squat-001',
 * });
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { useMotionEngine } from './useMotionEngine';
import { DetectedRep, MotionEngineConfig } from '../types';

// ============= TYPES =============

interface UseWorkoutSessionOptions {
  /** Total number of sets planned */
  totalSets: number;

  /** Target reps per set */
  targetRepsPerSet: number;

  /** Exercise ID (for database) */
  exerciseId: string;

  /** User ID (for database) */
  userId: string;

  /** Custom motion engine config */
  config?: MotionEngineConfig;

  /** Callback when set is completed */
  onSetComplete?: (setData: SetData) => void;

  /** Callback when session ends */
  onSessionComplete?: (sessionData: SessionData) => void;
}

interface SetData {
  setNumber: number;
  repsCompleted: number;
  targetReps: number;
  duration: number; // milliseconds
  reps: DetectedRep[]; // All reps in this set
  averageScore: number;
  startTime: number;
  endTime: number;
}

interface SessionData {
  userId: string;
  exerciseId: string;
  sets: SetData[];
  totalReps: number;
  totalDuration: number; // milliseconds
  averageScore: number;
  startTime: number;
  endTime: number;
}

type SessionState = 'idle' | 'active' | 'resting' | 'completed';

interface UseWorkoutSessionReturn {
  // Session state
  sessionState: SessionState;
  currentSet: number;
  totalSets: number;
  targetReps: number;

  // Current set metrics
  repCount: ReturnType<typeof useMotionEngine>['repCount'];
  currentPhase: ReturnType<typeof useMotionEngine>['currentPhase'];
  lastRepScore: ReturnType<typeof useMotionEngine>['lastRepScore'];
  isActive: ReturnType<typeof useMotionEngine>['isActive'];
  accelerometerData: ReturnType<typeof useMotionEngine>['accelerometerData'];

  // Session metrics
  totalRepsCompleted: number;
  sessionDuration: number;

  // Actions
  startSet: () => Promise<void>;
  pauseSet: () => void;
  resumeSet: () => void;
  completeSet: () => void;
  endSession: () => SessionData;

  // Data access
  getCurrentSetData: () => SetData | null;
  getSessionData: () => SessionData;
}

// ============= HOOK =============

export const useWorkoutSession = (
  options: UseWorkoutSessionOptions
): UseWorkoutSessionReturn => {
  const {
    totalSets,
    targetRepsPerSet,
    exerciseId,
    userId,
    config,
    onSetComplete,
    onSessionComplete,
  } = options;

  // Session state
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [currentSet, setCurrentSet] = useState(1);
  const [currentSetReps, setCurrentSetReps] = useState<DetectedRep[]>([]);
  const [completedSets, setCompletedSets] = useState<SetData[]>([]);

  // Timing refs
  const sessionStartTimeRef = useRef<number>(0);
  const setStartTimeRef = useRef<number>(0);

  // Motion engine integration
  const motionEngine = useMotionEngine({
    config,
    onRepDetected: (rep) => {
      // Add rep to current set
      setCurrentSetReps((prev) => [...prev, rep]);
    },
    onError: (error) => {
      console.error('[useWorkoutSession] Motion engine error:', error);
    },
  });

  /**
   * Start a new set
   */
  const startSet = useCallback(async () => {
    try {
      // Start session timer on first set
      if (currentSet === 1 && sessionStartTimeRef.current === 0) {
        sessionStartTimeRef.current = Date.now();
      }

      // Start set timer
      setStartTimeRef.current = Date.now();

      // Clear previous set reps
      setCurrentSetReps([]);

      // Start motion engine
      await motionEngine.start();

      setSessionState('active');
    } catch (error) {
      console.error('[useWorkoutSession] Start set error:', error);
      throw error;
    }
  }, [currentSet, motionEngine]);

  /**
   * Pause current set
   */
  const pauseSet = useCallback(() => {
    motionEngine.pause();
  }, [motionEngine]);

  /**
   * Resume current set
   */
  const resumeSet = useCallback(() => {
    motionEngine.resume();
  }, [motionEngine]);

  /**
   * Complete current set
   */
  const completeSet = useCallback(() => {
    // Stop motion engine
    motionEngine.stop();

    const endTime = Date.now();
    const duration = endTime - setStartTimeRef.current;

    // Calculate average score
    const scores = currentSetReps
      .filter((rep) => rep.score)
      .map((rep) => rep.score!.overall);
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    // Create set data
    const setData: SetData = {
      setNumber: currentSet,
      repsCompleted: currentSetReps.length,
      targetReps: targetRepsPerSet,
      duration,
      reps: currentSetReps,
      averageScore,
      startTime: setStartTimeRef.current,
      endTime,
    };

    // Add to completed sets
    setCompletedSets((prev) => [...prev, setData]);

    // Callback
    if (onSetComplete) {
      onSetComplete(setData);
    }

    // Check if session is complete
    if (currentSet >= totalSets) {
      setSessionState('completed');
    } else {
      setSessionState('resting');
      setCurrentSet((prev) => prev + 1);
    }

    // Reset current set reps
    setCurrentSetReps([]);
  }, [currentSet, totalSets, targetRepsPerSet, currentSetReps, motionEngine, onSetComplete]);

  /**
   * End entire session (can be called early)
   */
  const endSession = useCallback((): SessionData => {
    // Stop motion engine if running
    if (motionEngine.isActive.value) {
      motionEngine.stop();
    }

    const endTime = Date.now();
    const totalDuration = endTime - sessionStartTimeRef.current;

    // Calculate total metrics
    const totalReps = completedSets.reduce((sum, set) => sum + set.repsCompleted, 0);
    const allScores = completedSets.flatMap((set) =>
      set.reps.filter((rep) => rep.score).map((rep) => rep.score!.overall)
    );
    const averageScore = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

    const sessionData: SessionData = {
      userId,
      exerciseId,
      sets: completedSets,
      totalReps,
      totalDuration,
      averageScore,
      startTime: sessionStartTimeRef.current,
      endTime,
    };

    setSessionState('completed');

    // Callback
    if (onSessionComplete) {
      onSessionComplete(sessionData);
    }

    return sessionData;
  }, [userId, exerciseId, completedSets, motionEngine, onSessionComplete]);

  /**
   * Get current set data (in progress)
   */
  const getCurrentSetData = useCallback((): SetData | null => {
    if (sessionState !== 'active') return null;

    const scores = currentSetReps
      .filter((rep) => rep.score)
      .map((rep) => rep.score!.overall);
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    return {
      setNumber: currentSet,
      repsCompleted: currentSetReps.length,
      targetReps: targetRepsPerSet,
      duration: Date.now() - setStartTimeRef.current,
      reps: currentSetReps,
      averageScore,
      startTime: setStartTimeRef.current,
      endTime: Date.now(),
    };
  }, [sessionState, currentSet, targetRepsPerSet, currentSetReps]);

  /**
   * Get complete session data
   */
  const getSessionData = useCallback((): SessionData => {
    const totalReps = completedSets.reduce((sum, set) => sum + set.repsCompleted, 0);
    const allScores = completedSets.flatMap((set) =>
      set.reps.filter((rep) => rep.score).map((rep) => rep.score!.overall)
    );
    const averageScore = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

    return {
      userId,
      exerciseId,
      sets: completedSets,
      totalReps,
      totalDuration: sessionStartTimeRef.current
        ? Date.now() - sessionStartTimeRef.current
        : 0,
      averageScore,
      startTime: sessionStartTimeRef.current,
      endTime: Date.now(),
    };
  }, [userId, exerciseId, completedSets]);

  // Calculate total reps completed
  const totalRepsCompleted = completedSets.reduce((sum, set) => sum + set.repsCompleted, 0);

  // Calculate session duration
  const sessionDuration = sessionStartTimeRef.current
    ? Date.now() - sessionStartTimeRef.current
    : 0;

  return {
    // Session state
    sessionState,
    currentSet,
    totalSets,
    targetReps: targetRepsPerSet,

    // Current set metrics (from motion engine)
    repCount: motionEngine.repCount,
    currentPhase: motionEngine.currentPhase,
    lastRepScore: motionEngine.lastRepScore,
    isActive: motionEngine.isActive,
    accelerometerData: motionEngine.accelerometerData,

    // Session metrics
    totalRepsCompleted,
    sessionDuration,

    // Actions
    startSet,
    pauseSet,
    resumeSet,
    completeSet,
    endSession,

    // Data access
    getCurrentSetData,
    getSessionData,
  };
};
