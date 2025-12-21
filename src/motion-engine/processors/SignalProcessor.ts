/**
 * Signal Processor - Noise Reduction + Magnitude Calculation
 * TrynerApp - Motion Engine
 *
 * Transforms raw accelerometer data into processed signals
 * suitable for rep detection.
 *
 * Pipeline:
 * 1. Apply low-pass filter to reduce noise
 * 2. Calculate magnitude vectors (√(x² + y² + z²))
 * 3. Return both raw and filtered data for flexibility
 */

import { AccelerometerData, ProcessedSensorData } from '../types';
import { LowPassFilter } from './LowPassFilter';

export class SignalProcessor {
  private filter: LowPassFilter;

  /**
   * @param lowPassAlpha - Smoothing factor for low-pass filter (0-1)
   *                       Default: 0.22 (balanced for squat detection)
   */
  constructor(lowPassAlpha: number = 0.22) {
    this.filter = new LowPassFilter(lowPassAlpha);
  }

  /**
   * Process raw accelerometer data
   *
   * Applies filtering and calculates magnitudes for both raw and filtered signals
   *
   * @param raw - Raw accelerometer reading from expo-sensors
   * @returns Processed data with filtered values and magnitudes
   */
  process(raw: AccelerometerData): ProcessedSensorData {
    // Apply low-pass filter to reduce noise
    const [filteredX, filteredY, filteredZ] = this.filter.filter(raw.x, raw.y, raw.z);

    // Calculate magnitude of raw signal: √(x² + y² + z²)
    const magnitude = this.calculateMagnitude(raw.x, raw.y, raw.z);

    // Calculate magnitude of filtered signal
    const filteredMagnitude = this.calculateMagnitude(filteredX, filteredY, filteredZ);

    return {
      // Raw values (from sensor)
      x: raw.x,
      y: raw.y,
      z: raw.z,
      timestamp: raw.timestamp,

      // Processed values
      magnitude,
      filteredX,
      filteredY,
      filteredZ,
      filteredMagnitude,
    };
  }

  /**
   * Calculate vector magnitude: √(x² + y² + z²)
   *
   * This represents the total acceleration in 3D space,
   * independent of device orientation.
   *
   * @param x - X-axis acceleration (G)
   * @param y - Y-axis acceleration (G)
   * @param z - Z-axis acceleration (G)
   * @returns Magnitude in G-force units
   */
  private calculateMagnitude(x: number, y: number, z: number): number {
    return Math.sqrt(x * x + y * y + z * z);
  }

  /**
   * Reset processor state (clears filter history)
   * Call this when starting a new workout session
   */
  reset(): void {
    this.filter.reset();
  }

  /**
   * Update low-pass filter alpha coefficient
   * Useful for runtime tuning based on user feedback
   *
   * @param alpha - New smoothing factor (0-1)
   */
  setFilterAlpha(alpha: number): void {
    this.filter.setAlpha(alpha);
  }

  /**
   * Get current filter alpha value
   */
  getFilterAlpha(): number {
    return this.filter.getAlpha();
  }

  /**
   * Check if processor is ready (filter initialized)
   */
  isReady(): boolean {
    return this.filter.isReady();
  }
}
