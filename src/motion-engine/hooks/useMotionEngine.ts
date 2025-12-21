/**
 * useMotionEngine Hook - React Integration (Simplified for Expo Go)
 * TrynerApp - Motion Engine
 *
 * SIMPLIFIED VERSION: Uses React state instead of Reanimated shared values
 * to prevent crashes in Expo Go with the Worklets module.
 *
 * Features:
 * - React state for rep counting and data
 * - Haptic feedback on rep detection
 * - Automatic cleanup on unmount
 * - Real-time accelerometer data for graphing
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import {
  MotionEngine,
  MotionEngineConfig,
  DetectedRep,
  RepPhase,
  ProcessedSensorData,
  DEFAULT_MOTION_CONFIG,
} from '../index';

// ============= TYPES =============

interface UseMotionEngineOptions {
  /** Custom configuration (optional) */
  config?: MotionEngineConfig;

  /** Callback when rep is detected (receives rep with score) */
  onRepDetected?: (rep: DetectedRep) => void;

  /** Callback on error */
  onError?: (error: Error) => void;

  /** Enable haptic feedback (default: true) */
  enableHaptics?: boolean;

  /** Enable sound feedback (default: true) */
  enableSound?: boolean;
}

interface UseMotionEngineReturn {
  // React state values
  repCount: number;
  currentPhase: RepPhase;
  lastRepScore: number;
  isActive: boolean;
  accelerometerData: ProcessedSensorData[];

  // Control functions
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;

  // Status
  getStatus: () => {
    repCount: number;
    averageScore: number;
    sessionDuration: number;
    isRunning: boolean;
  };
}

// ============= HOOK =============

export const useMotionEngine = (options: UseMotionEngineOptions = {}): UseMotionEngineReturn => {
  const {
    config = DEFAULT_MOTION_CONFIG,
    onRepDetected,
    onError,
    enableHaptics = true,
    enableSound = true,
  } = options;

  // React state (simpler and more stable than Reanimated shared values)
  const [repCount, setRepCount] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<RepPhase>('idle');
  const [lastRepScore, setLastRepScore] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [accelerometerData, setAccelerometerData] = useState<ProcessedSensorData[]>([]);

  // Engine instance (persists across renders)
  const engineRef = useRef<MotionEngine | null>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  // Store callbacks in refs to avoid re-initializing engine on every render
  const onRepDetectedRef = useRef(onRepDetected);
  const onErrorRef = useRef(onError);
  const enableHapticsRef = useRef(enableHaptics);

  // Update refs when callbacks change
  useEffect(() => {
    onRepDetectedRef.current = onRepDetected;
  }, [onRepDetected]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    enableHapticsRef.current = enableHaptics;
  }, [enableHaptics]);

  // Haptic throttle ref
  const lastHapticTimeRef = useRef(0);
  const HAPTIC_THROTTLE_MS = 400; // Minimum time between haptics

  /**
   * Handle rep detected with feedback
   */
  const handleRepDetected = useCallback((rep: DetectedRep) => {
    if (!isMountedRef.current) return;

    // 1. Haptic feedback (THROTTLED)
    if (enableHapticsRef.current) {
      const now = Date.now();
      if (now - lastHapticTimeRef.current >= HAPTIC_THROTTLE_MS) {
        lastHapticTimeRef.current = now;
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        } catch (e) {
          // Ignore haptic errors
        }
      }
    }

    // 2. Update state
    setRepCount(rep.repNumber);
    setLastRepScore(rep.score?.overall || 0);
    setCurrentPhase('completed');

    // Reset phase after brief delay
    setTimeout(() => {
      if (isMountedRef.current) {
        setCurrentPhase('idle');
      }
    }, 300);

    // 3. User callback
    if (onRepDetectedRef.current) {
      try {
        onRepDetectedRef.current(rep);
      } catch (e) {
        console.error('[useMotionEngine] Error in onRepDetected callback:', e);
      }
    }

    if (__DEV__) {
      console.log('[useMotionEngine] 🎯 Rep detected callback fired');
    }
  }, []);

  // Initialize engine ONCE on mount
  useEffect(() => {
    isMountedRef.current = true;

    if (__DEV__) {
      console.log('[useMotionEngine] 🏗️ Initializing motion engine...');
    }

    engineRef.current = new MotionEngine(config, {
      onRepDetected: handleRepDetected,

      onStateChange: (state) => {
        if (!isMountedRef.current) return;

        if (__DEV__) {
          console.log('[useMotionEngine] State changed:', state);
        }

        setIsActive(state === 'active');

        if (state === 'active') {
          sessionStartTimeRef.current = Date.now();
        }
      },

      onError: (error) => {
        console.error('[useMotionEngine] ❌ Error:', error);
        if (onErrorRef.current) {
          onErrorRef.current(error);
        }
      },
    });

    if (__DEV__) {
      console.log('[useMotionEngine] ✅ Motion engine initialized');
    }

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      if (__DEV__) {
        console.log('[useMotionEngine] 🧹 Cleaning up...');
      }
      if (engineRef.current?.isRunning()) {
        engineRef.current.stop();
      }
    };
  }, []);

  // Update accelerometer data periodically (1 Hz - very conservative)
  useEffect(() => {
    if (!engineRef.current) return;

    if (__DEV__) {
      console.log('[useMotionEngine] 📊 Starting data sync interval (1 Hz)');
    }
    let updateCount = 0;

    const interval = setInterval(() => {
      if (!isMountedRef.current) return;

      try {
        if (engineRef.current?.isRunning()) {
          const data = engineRef.current.getRecentData();

          if (data && data.length > 0) {
            // Only get last 20 samples to minimize memory
            const limitedData = data.slice(-20);

            // Create simple copy with essential fields only
            const simpleCopy: ProcessedSensorData[] = limitedData.map(item => ({
              timestamp: item.timestamp,
              x: item.x,
              y: item.y,
              z: item.z,
              magnitude: item.magnitude,
              filteredX: item.filteredX,
              filteredY: item.filteredY,
              filteredZ: item.filteredZ,
              filteredMagnitude: item.filteredMagnitude,
            }));

            setAccelerometerData(simpleCopy);

            if (__DEV__) {
              updateCount++;
              if (updateCount % 10 === 0) {
                console.log(`[useMotionEngine] 📡 Data sync (${simpleCopy.length} samples)`);
              }
            }
          }
        }
      } catch (error) {
        console.error('[useMotionEngine] Data sync error:', error);
      }
    }, 1000); // 1 Hz - very conservative to prevent crashes

    return () => {
      clearInterval(interval);
    };
  }, []);

  /**
   * Start motion detection
   */
  const start = useCallback(async () => {
    if (__DEV__) {
      console.log('[useMotionEngine] 🚀 Start requested...');
    }

    if (!engineRef.current) {
      throw new Error('Motion engine not initialized');
    }

    // Reset state
    setRepCount(0);
    setCurrentPhase('idle');
    setLastRepScore(0);
    setAccelerometerData([]);

    await engineRef.current.start();

    if (__DEV__) {
      console.log('[useMotionEngine] ✅ Start completed successfully');
    }
  }, []);

  /**
   * Pause detection
   */
  const pause = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.pause();
  }, []);

  /**
   * Resume detection
   */
  const resume = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.resume();
  }, []);

  /**
   * Stop detection
   */
  const stop = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.stop();
    setIsActive(false);
  }, []);

  /**
   * Get current status
   */
  const getStatus = useCallback(() => {
    if (!engineRef.current) {
      return {
        repCount: 0,
        averageScore: 0,
        sessionDuration: 0,
        isRunning: false,
      };
    }

    const status = engineRef.current.getStatus();
    const sessionDuration = sessionStartTimeRef.current
      ? Date.now() - sessionStartTimeRef.current
      : 0;

    return {
      repCount: status.repCount,
      averageScore: status.averageScore,
      sessionDuration,
      isRunning: status.isRunning,
    };
  }, []);

  return {
    // State values
    repCount,
    currentPhase,
    lastRepScore,
    isActive,
    accelerometerData,

    // Control
    start,
    pause,
    resume,
    stop,

    // Status
    getStatus,
  };
};
