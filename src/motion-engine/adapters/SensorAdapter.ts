/**
 * Sensor Adapter - expo-sensors Wrapper with Circular Buffer
 * TrynerApp - Motion Engine
 *
 * Responsibilities:
 * - Subscribe to device accelerometer via expo-sensors
 * - Maintain circular buffer of recent readings (240 samples = 4s)
 * - Normalize timestamps relative to session start
 * - Provide buffer access for peak detection algorithms
 */

import { Accelerometer } from 'expo-sensors';
import type { Subscription } from 'expo-sensors/build/Pedometer';
import { AccelerometerData } from '../types';

interface SensorAdapterConfig {
  samplingRate: number;  // Target Hz (default: 60)
  bufferSize: number;    // Max samples to store (default: 240 = 4s)
}

export class SensorAdapter {
  private config: SensorAdapterConfig;
  private buffer: AccelerometerData[] = [];
  private subscription: Subscription | null = null;
  private sessionStartTime: number = 0;
  private isActive: boolean = false;

  /**
   * @param config - Sampling rate and buffer size configuration
   */
  constructor(config: SensorAdapterConfig) {
    this.config = config;
  }

  /**
   * Start accelerometer subscription
   *
   * @param onData - Callback invoked on each new accelerometer reading
   * @throws Error if sensor is unavailable or already started
   */
  async start(onData: (data: AccelerometerData) => void): Promise<void> {
    if (this.isActive) {
      throw new Error('SensorAdapter: Already started');
    }

    if (__DEV__) {
      console.log('[SensorAdapter] 🚀 Starting accelerometer...');
    }

    // Check sensor availability
    const isAvailable = await Accelerometer.isAvailableAsync();
    if (__DEV__) {
      console.log('[SensorAdapter] Sensor available:', isAvailable);
    }

    if (!isAvailable) {
      throw new Error('SensorAdapter: Accelerometer not available on this device');
    }

    // Request permissions (iOS always returns granted, Android may prompt)
    // Note: iOS doesn't require user permission for accelerometer
    const { status } = await Accelerometer.requestPermissionsAsync();
    if (__DEV__) {
      console.log('[SensorAdapter] Permission status:', status);
    }

    if (status !== 'granted') {
      throw new Error('SensorAdapter: Accelerometer permission denied. Please enable motion access in Settings.');
    }

    // Record session start time for timestamp normalization
    this.sessionStartTime = Date.now();
    if (__DEV__) {
      console.log('[SensorAdapter] Session start time:', this.sessionStartTime);
    }

    // Clear any old data from previous sessions
    this.buffer = [];

    // Set sampling interval FIRST (must be done before listener on some devices)
    const intervalMs = 1000 / this.config.samplingRate;
    if (__DEV__) {
      console.log('[SensorAdapter] Setting update interval:', intervalMs, 'ms (', this.config.samplingRate, 'Hz)');
    }
    Accelerometer.setUpdateInterval(intervalMs);

    // Subscribe to accelerometer updates
    let dataReceivedCount = 0;
    this.subscription = Accelerometer.addListener((sensorData) => {
      dataReceivedCount++;

      // PERFORMANCE: Only log first 5 samples in dev mode
      if (__DEV__ && dataReceivedCount <= 5) {
        console.log(`[SensorAdapter] Sample #${dataReceivedCount}:`, {
          x: sensorData.x.toFixed(3),
          y: sensorData.y.toFixed(3),
          z: sensorData.z.toFixed(3),
        });
      }

      // Create normalized data object
      const data: AccelerometerData = {
        x: sensorData.x,
        y: sensorData.y,
        z: sensorData.z,
        timestamp: Date.now() - this.sessionStartTime, // Relative timestamp (ms)
      };

      // Add to circular buffer
      this.addToBuffer(data);

      // Invoke callback
      onData(data);
    });

    if (__DEV__) {
      console.log('[SensorAdapter] ✅ Listener registered. Waiting for data...');
    }

    this.isActive = true;
  }

  /**
   * Stop accelerometer subscription
   */
  stop(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.isActive = false;
  }

  /**
   * Add sample to circular buffer
   * If buffer exceeds max size, remove oldest sample (FIFO)
   *
   * @param data - Accelerometer sample to add
   */
  private addToBuffer(data: AccelerometerData): void {
    this.buffer.push(data);

    // Maintain circular buffer size (remove oldest if exceeding limit)
    if (this.buffer.length > this.config.bufferSize) {
      this.buffer.shift(); // Remove first (oldest) element
    }
  }

  /**
   * Get entire buffer (for peak detection)
   * Returns a copy to prevent external mutations
   *
   * @returns Array of recent accelerometer samples
   */
  getBuffer(): AccelerometerData[] {
    return [...this.buffer];
  }

  /**
   * Get last N samples from buffer
   *
   * @param count - Number of recent samples to retrieve
   * @returns Array of recent samples (may be less than count if buffer is small)
   */
  getRecentSamples(count: number): AccelerometerData[] {
    const startIndex = Math.max(0, this.buffer.length - count);
    return this.buffer.slice(startIndex);
  }

  /**
   * Get current buffer size
   */
  getBufferLength(): number {
    return this.buffer.length;
  }

  /**
   * Clear buffer (useful when starting new set)
   */
  clearBuffer(): void {
    this.buffer = [];
  }

  /**
   * Check if adapter is actively collecting data
   */
  isRunning(): boolean {
    return this.isActive;
  }

  /**
   * Get session start time (for debugging)
   */
  getSessionStartTime(): number {
    return this.sessionStartTime;
  }

  /**
   * Get current configuration
   */
  getConfig(): SensorAdapterConfig {
    return { ...this.config };
  }
}
