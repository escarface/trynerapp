/**
 * Motion Engine - Main Orchestrator
 * TrynerApp - Real-time Rep Detection System
 *
 * Orchestrates the complete motion detection pipeline:
 * Sensor → Signal Processing → Rep Detection → Scoring → Callbacks
 *
 * Public API:
 * - start() / pause() / resume() / stop()
 * - getStatus() - Current state and metrics
 * - getRecentData() - For real-time graphing
 */

import {
  MotionEngineConfig,
  MotionEngineCallbacks,
  MotionEngineStatus,
  MotionEngineState,
  ProcessedSensorData,
  DetectedRep,
  AccelerometerData,
} from '../types';
import { SensorAdapter } from '../adapters/SensorAdapter';
import { SignalProcessor } from '../processors/SignalProcessor';
import { SquatDetector } from '../detectors/SquatDetector';
import { ScoringEngine } from '../scoring/ScoringEngine';
import { DEFAULT_MOTION_CONFIG } from './constants';

export class MotionEngine {
  private config: MotionEngineConfig;
  private callbacks: MotionEngineCallbacks;

  // Pipeline components
  private sensorAdapter: SensorAdapter;
  private signalProcessor: SignalProcessor;
  private detector: SquatDetector;
  private scorer: ScoringEngine;

  // State
  private state: MotionEngineState = 'idle';
  private sessionStartTime: number | null = null;
  private lastRepTimestamp: number | null = null;
  private totalScore: number = 0;
  private scoreCount: number = 0;

  // Recent data buffer (for graphing)
  private recentData: ProcessedSensorData[] = [];
  private readonly MAX_RECENT_DATA = 60; // 1 second at 60Hz (reduced from 120 to save memory)

  /**
   * @param config - Motion Engine configuration
   * @param callbacks - Event callbacks
   */
  constructor(
    config: MotionEngineConfig = DEFAULT_MOTION_CONFIG,
    callbacks: MotionEngineCallbacks
  ) {
    this.config = config;
    this.callbacks = callbacks;

    // Initialize pipeline components
    this.sensorAdapter = new SensorAdapter({
      samplingRate: config.detectionConfig.samplingRate,
      bufferSize: config.detectionConfig.bufferSize,
    });

    this.signalProcessor = new SignalProcessor(config.detectionConfig.lowPassAlpha);

    this.detector = new SquatDetector(config.detectionConfig);

    this.scorer = new ScoringEngine();
  }

  /**
   * Start motion detection session
   *
   * @throws Error if already running or sensor unavailable
   */
  async start(): Promise<void> {
    if (this.state === 'active') {
      throw new Error('MotionEngine: Already running');
    }

    try {
      if (__DEV__) {
        console.log('[MotionEngine] 🎬 Starting motion detection...');
      }
      this.setState('starting');

      // Reset all components
      this.signalProcessor.reset();
      this.detector.reset();
      this.recentData = [];
      this.sessionStartTime = Date.now();
      this.lastRepTimestamp = null;
      this.totalScore = 0;
      this.scoreCount = 0;
      this.consecutivePipelineErrors = 0; // Reset error counter on new session

      // Start sensor (this will throw if permission denied)
      await this.sensorAdapter.start((rawData) => this.handleSensorData(rawData));

      if (__DEV__) {
        console.log('[MotionEngine] ✅ Motion detection started successfully');
      }
      this.setState('active');
    } catch (error) {
      console.error('[MotionEngine] ❌ Failed to start:', error);
      this.setState('idle');
      this.callbacks.onError(error as Error);
      throw error;
    }
  }

  /**
   * Pause detection (sensor keeps running but reps aren't counted)
   */
  pause(): void {
    if (this.state !== 'active') {
      throw new Error('MotionEngine: Not running');
    }
    this.setState('paused');
  }

  /**
   * Resume from paused state
   */
  resume(): void {
    if (this.state !== 'paused') {
      throw new Error('MotionEngine: Not paused');
    }
    this.setState('active');
  }

  /**
   * Stop detection session
   */
  stop(): void {
    if (this.state === 'idle' || this.state === 'stopped') {
      return; // Already stopped
    }

    this.sensorAdapter.stop();
    this.setState('stopped');
  }

  // Error counter to prevent crash loops
  private consecutivePipelineErrors = 0;
  private readonly MAX_CONSECUTIVE_ERRORS = 10;

  /**
   * Handle incoming sensor data (main pipeline)
   *
   * Pipeline: Raw Data → Process → Detect → Score → Callback
   *
   * @param rawData - Raw accelerometer reading
   */
  private handleSensorData(rawData: AccelerometerData): void {
    // PERFORMANCE: Only log in dev mode and only first 3 samples
    if (__DEV__ && this.recentData.length < 3) {
      console.log(`[MotionEngine] Processing data #${this.recentData.length + 1}:`, {
        x: rawData.x.toFixed(3),
        y: rawData.y.toFixed(3),
        z: rawData.z.toFixed(3),
        timestamp: rawData.timestamp,
      });
    }

    // Don't process if paused
    if (this.state !== 'active') return;

    // CRITICAL FIX: Stop processing if too many errors (prevent crash loop)
    if (this.consecutivePipelineErrors >= this.MAX_CONSECUTIVE_ERRORS) {
      console.error('[MotionEngine] 🚨 Too many consecutive errors, stopping engine');
      this.stop();
      this.callbacks.onError(new Error('Motion engine stopped due to excessive errors'));
      return;
    }

    try {
      // 1. Process signal (filter + magnitude)
      let processed;
      try {
        processed = this.signalProcessor.process(rawData);
      } catch (processorError) {
        console.error('[MotionEngine] ❌ Signal processor error:', processorError);
        this.consecutivePipelineErrors++;
        return;
      }

      // 2. Store for graphing (circular buffer)
      try {
        this.addToRecentData(processed);
      } catch (bufferError) {
        console.error('[MotionEngine] ❌ Buffer error:', bufferError);
        // Don't increment error counter for buffer errors, not critical
      }

      // 3. Detect rep (with error protection)
      let detectedRep = null;
      try {
        detectedRep = this.detector.detect(processed);
      } catch (detectorError) {
        console.error('[MotionEngine] ❌ Detector error:', detectorError);
        this.consecutivePipelineErrors++;
        return;
      }

      // 4. If rep detected and valid, score it and fire callback
      if (detectedRep && detectedRep.isValid) {
        try {
          const score = this.scorer.score(detectedRep.features);
          const repWithScore: DetectedRep = { ...detectedRep, score };

          // Update metrics
          this.lastRepTimestamp = detectedRep.timestamp;
          this.totalScore += score.overall;
          this.scoreCount++;

          // CRITICAL FIX: Wrap callback in try-catch to prevent callback errors from crashing engine
          try {
            this.callbacks.onRepDetected(repWithScore);
          } catch (callbackError) {
            console.error('[MotionEngine] ❌ Callback error:', callbackError);
            // Don't increment error counter for callback errors - those are user code issues
          }

          // Only log in dev mode or when debug is enabled
          if (__DEV__ && this.config.enableDebugMode) {
            console.log('[MotionEngine] Rep detected:', {
              repNumber: repWithScore.repNumber,
              score: score.overall,
              technique: score.technique,
              depth: detectedRep.depth.toFixed(2),
              duration: detectedRep.duration,
            });
          }
        } catch (scoringError) {
          console.error('[MotionEngine] ❌ Scoring error:', scoringError);
          this.consecutivePipelineErrors++;
        }
      }

      // Reset error counter on successful pipeline run
      this.consecutivePipelineErrors = 0;
    } catch (error) {
      this.consecutivePipelineErrors++;
      console.error(`[MotionEngine] ❌ Pipeline error (${this.consecutivePipelineErrors}/${this.MAX_CONSECUTIVE_ERRORS}):`, error);

      // Only fire error callback if not at max errors (prevent callback spam)
      if (this.consecutivePipelineErrors < this.MAX_CONSECUTIVE_ERRORS) {
        try {
          this.callbacks.onError(error as Error);
        } catch (callbackError) {
          console.error('[MotionEngine] ❌ Error callback failed:', callbackError);
        }
      }
    }
  }

  /**
   * Add processed data to recent buffer (for graphing)
   * Maintains circular buffer of last N samples
   */
  private addToRecentData(data: ProcessedSensorData): void {
    this.recentData.push(data);

    // Keep only last N samples (circular buffer)
    if (this.recentData.length > this.MAX_RECENT_DATA) {
      this.recentData.shift();
    }
  }

  /**
   * Update internal state and fire callback
   */
  private setState(newState: MotionEngineState): void {
    const previousState = this.state;
    this.state = newState;

    if (previousState !== newState) {
      this.callbacks.onStateChange(newState);

      // Only log in dev mode AND when debug is enabled
      if (__DEV__ && this.config.enableDebugMode) {
        console.log(`[MotionEngine] State: ${previousState} → ${newState}`);
      }
    }
  }

  /**
   * Get current status
   */
  getStatus(): MotionEngineStatus {
    return {
      state: this.state,
      isRunning: this.state === 'active' || this.state === 'paused',
      repCount: this.detector.getRepCount(),
      lastRepTimestamp: this.lastRepTimestamp,
      currentPhase: this.detector.getCurrentPhase(),
      averageScore: this.scoreCount > 0 ? Math.round(this.totalScore / this.scoreCount) : 0,
      sessionStartTime: this.sessionStartTime,
    };
  }

  /**
   * Get recent processed data (for real-time graphing)
   *
   * @returns Array of recent processed sensor data
   */
  getRecentData(): ProcessedSensorData[] {
    return [...this.recentData]; // Return copy
  }

  /**
   * Get current configuration
   */
  getConfig(): MotionEngineConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (for runtime tuning)
   *
   * Note: Some config changes require restart to take effect
   */
  setConfig(config: Partial<MotionEngineConfig>): void {
    this.config = { ...this.config, ...config };

    // Update detector config if provided
    if (config.detectionConfig) {
      this.detector.setConfig(config.detectionConfig);
    }
  }

  /**
   * Check if engine is currently running
   */
  isRunning(): boolean {
    return this.state === 'active' || this.state === 'paused';
  }

  /**
   * Get sensor buffer (for advanced debugging)
   */
  getSensorBuffer(): AccelerometerData[] {
    return this.sensorAdapter.getBuffer();
  }
}
