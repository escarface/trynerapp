/**
 * Peak Detector - Local Maxima/Minima Detection
 * TrynerApp - Motion Engine
 *
 * Detects peaks (local maxima) and valleys (local minima) in signal data.
 * Used for identifying squat phases: peaks = standing, valleys = bottom position.
 *
 * Algorithm:
 * 1. Find local maxima/minima (higher/lower than neighbors)
 * 2. Filter by prominence (minimum height above surroundings)
 * 3. Filter by minimum distance (prevent duplicate detections)
 */

import { Peak, Valley, ProcessedSensorData } from '../types';

interface PeakDetectionConfig {
  prominence: number;        // Minimum peak height above baseline
  minDistance: number;       // Minimum samples between peaks
}

export class PeakDetector {
  private config: PeakDetectionConfig;

  /**
   * @param config - Peak detection parameters
   */
  constructor(config: PeakDetectionConfig) {
    this.config = config;
  }

  /**
   * Find peaks (local maxima) in magnitude signal
   *
   * @param data - Array of processed sensor data
   * @param useFiltered - Use filteredMagnitude (true) or raw magnitude (false)
   * @returns Array of detected peaks
   */
  findPeaks(data: ProcessedSensorData[], useFiltered: boolean = true): Peak[] {
    if (data.length < 3) return []; // Need at least 3 points

    const signal = data.map(d => useFiltered ? d.filteredMagnitude : d.magnitude);
    const peaks: Peak[] = [];

    // Scan for local maxima (ignore first and last points)
    for (let i = 1; i < signal.length - 1; i++) {
      const current = signal[i];
      const previous = signal[i - 1];
      const next = signal[i + 1];

      // Check if local maximum
      if (current > previous && current > next) {
        const prominence = this.calculateProminence(signal, i);

        // Filter by prominence threshold
        if (prominence >= this.config.prominence) {
          peaks.push({
            value: current,
            index: i,
            timestamp: data[i].timestamp,
            prominence,
          });
        }
      }
    }

    // Filter by minimum distance
    return this.filterByDistance(peaks);
  }

  /**
   * Find valleys (local minima) in signal
   *
   * Typically used on Z-axis to detect downward movement in squats
   *
   * @param data - Array of processed sensor data
   * @param useFiltered - Use filteredZ (true) or raw Z (false)
   * @returns Array of detected valleys
   */
  findValleys(data: ProcessedSensorData[], useFiltered: boolean = true): Valley[] {
    if (data.length < 3) return []; // Need at least 3 points

    const signal = data.map(d => useFiltered ? d.filteredZ : d.z);
    const valleys: Valley[] = [];

    // Scan for local minima
    for (let i = 1; i < signal.length - 1; i++) {
      const current = signal[i];
      const previous = signal[i - 1];
      const next = signal[i + 1];

      // Check if local minimum
      if (current < previous && current < next) {
        const prominence = this.calculateProminence(signal, i, true);

        // Filter by prominence threshold
        if (prominence >= this.config.prominence) {
          valleys.push({
            value: current,
            index: i,
            timestamp: data[i].timestamp,
            prominence,
          });
        }
      }
    }

    // Filter by minimum distance
    return this.filterByDistance(valleys);
  }

  /**
   * Calculate peak/valley prominence
   *
   * Prominence = how much a peak/valley stands out from surrounding baseline
   * For peaks: height above average of left/right troughs
   * For valleys: depth below average of left/right peaks
   *
   * @param signal - Signal array
   * @param index - Index of peak/valley
   * @param isValley - True if calculating for valley (inverted logic)
   * @returns Prominence value
   */
  private calculateProminence(signal: number[], index: number, isValley: boolean = false): number {
    const peakValue = signal[index];

    // Find surrounding troughs/peaks (within reasonable window)
    const windowSize = 10; // Look 10 samples in each direction
    const leftStart = Math.max(0, index - windowSize);
    const rightEnd = Math.min(signal.length, index + windowSize);

    // Get min/max in surrounding windows
    const leftWindow = signal.slice(leftStart, index);
    const rightWindow = signal.slice(index + 1, rightEnd);

    if (isValley) {
      // For valleys: prominence = depth below surrounding peaks
      const leftMax = leftWindow.length > 0 ? Math.max(...leftWindow) : peakValue;
      const rightMax = rightWindow.length > 0 ? Math.max(...rightWindow) : peakValue;
      const baseline = (leftMax + rightMax) / 2;
      return baseline - peakValue; // Positive value (depth below baseline)
    } else {
      // For peaks: prominence = height above surrounding troughs
      const leftMin = leftWindow.length > 0 ? Math.min(...leftWindow) : peakValue;
      const rightMin = rightWindow.length > 0 ? Math.min(...rightWindow) : peakValue;
      const baseline = (leftMin + rightMin) / 2;
      return peakValue - baseline; // Positive value (height above baseline)
    }
  }

  /**
   * Filter peaks/valleys by minimum distance
   *
   * If two peaks are closer than minDistance, keep only the more prominent one
   *
   * @param peaks - Array of peaks/valleys
   * @returns Filtered array with minimum distance enforced
   */
  private filterByDistance<T extends Peak | Valley>(peaks: T[]): T[] {
    if (peaks.length <= 1) return peaks;

    const filtered: T[] = [];
    let lastIndex = -Infinity;

    for (const peak of peaks) {
      const distance = peak.index - lastIndex;

      if (distance >= this.config.minDistance) {
        // Far enough from last peak
        filtered.push(peak);
        lastIndex = peak.index;
      } else {
        // Too close - keep the more prominent one
        const lastPeak = filtered[filtered.length - 1];
        if (peak.prominence > lastPeak.prominence) {
          filtered[filtered.length - 1] = peak; // Replace last with current
          lastIndex = peak.index;
        }
      }
    }

    return filtered;
  }

  /**
   * Update detection configuration
   */
  setConfig(config: Partial<PeakDetectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): PeakDetectionConfig {
    return { ...this.config };
  }
}
