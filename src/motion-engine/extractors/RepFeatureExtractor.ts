/**
 * Rep Feature Extractor - Extract Quality Metrics
 * TrynerApp - Motion Engine
 *
 * Extracts features from detected repetitions for scoring and validation.
 *
 * Features extracted:
 * - Timing: Descend/ascend/total duration
 * - Quality: Depth, stability, range scores (0-100)
 * - Raw: Peak/valley magnitudes, changes
 */

import { RepFeatures } from '../types';

interface RepDataForExtraction {
  descendStartTime: number;
  bottomTime: number;
  ascendStartTime: number;
  completionTime: number;
  peakMagnitude: number;
  valleyMagnitude: number;
  peakZValue: number;
  valleyZValue: number;
}

export class RepFeatureExtractor {
  /**
   * Extract features from rep data
   *
   * @param data - Rep timing and magnitude data
   * @returns RepFeatures object with all calculated metrics
   */
  extract(data: RepDataForExtraction): RepFeatures {
    // Calculate timing features
    const descendDuration = data.bottomTime - data.descendStartTime;
    const ascendDuration = data.completionTime - data.ascendStartTime;
    const totalDuration = data.completionTime - data.descendStartTime;

    // Calculate magnitude changes
    const magnitudeChange = data.peakMagnitude - data.valleyMagnitude;
    const zAxisChange = data.valleyZValue - data.peakZValue; // Negative = downward

    // Calculate quality scores (0-100)
    const depthScore = this.calculateDepthScore(magnitudeChange);
    const stabilityScore = this.calculateStabilityScore(descendDuration, ascendDuration);
    const rangeScore = this.calculateRangeScore(magnitudeChange);

    return {
      // Timing
      descendDuration,
      ascendDuration,
      totalDuration,

      // Quality scores
      depthScore,
      stabilityScore,
      rangeScore,

      // Raw measurements
      peakMagnitude: data.peakMagnitude,
      valleyMagnitude: data.valleyMagnitude,
      magnitudeChange,
      zAxisChange,
    };
  }

  /**
   * Calculate depth score (0-100)
   *
   * Measures range of motion depth.
   * Higher magnitude change = deeper squat = higher score
   *
   * Scoring:
   * - ≥1.2 G: 100 (excellent full depth)
   * - 1.0 G: 90 (optimal depth)
   * - 0.8 G: 70 (minimum passing)
   * - <0.6 G: 0 (too shallow)
   *
   * @param magnitudeChange - Peak-to-valley magnitude (G)
   * @returns Score from 0-100
   */
  private calculateDepthScore(magnitudeChange: number): number {
    if (magnitudeChange >= 1.2) return 100;
    if (magnitudeChange >= 1.0) return 90;
    if (magnitudeChange >= 0.8) return 70;
    if (magnitudeChange >= 0.6) return 50;

    // Linear scale below 0.6
    return Math.max(0, (magnitudeChange / 0.6) * 50);
  }

  /**
   * Calculate stability score (0-100)
   *
   * Measures movement smoothness and control.
   * Balanced timing (similar descend/ascend) = higher stability
   *
   * Scoring:
   * - Ratio close to 1.0 (balanced) = high score
   * - Ratio far from 1.0 (rushed/jerky) = low score
   *
   * @param descendDuration - Descending phase duration (ms)
   * @param ascendDuration - Ascending phase duration (ms)
   * @returns Score from 0-100
   */
  private calculateStabilityScore(descendDuration: number, ascendDuration: number): number {
    // Prevent division by zero
    if (ascendDuration === 0 || descendDuration === 0) return 0;

    // Calculate timing ratio (smaller / larger)
    const ratio = Math.min(descendDuration, ascendDuration) / Math.max(descendDuration, ascendDuration);

    // Convert ratio to score
    // ratio = 1.0 (perfect balance) → 100
    // ratio = 0.7 (70% balance) → 85
    // ratio = 0.5 (50% balance) → 65
    // ratio < 0.3 → 0
    if (ratio >= 0.9) return 100;
    if (ratio >= 0.7) return 85;
    if (ratio >= 0.5) return 65;
    if (ratio >= 0.3) return 40;

    return Math.max(0, ratio * 100);
  }

  /**
   * Calculate range score (0-100)
   *
   * Measures consistency of range of motion across reps.
   * In MVP, this is simplified to just magnitude-based scoring.
   *
   * Future enhancement: Track historical rep data to measure
   * consistency across multiple reps.
   *
   * @param magnitudeChange - Peak-to-valley magnitude (G)
   * @returns Score from 0-100
   */
  private calculateRangeScore(magnitudeChange: number): number {
    // MVP: Use similar logic to depth score
    // Future: Compare to average of last 5 reps for consistency
    if (magnitudeChange >= 1.2) return 100;
    if (magnitudeChange >= 1.0) return 90;
    if (magnitudeChange >= 0.8) return 70;
    if (magnitudeChange >= 0.6) return 50;

    return Math.max(0, (magnitudeChange / 0.6) * 50);
  }

  /**
   * Calculate tempo score (0-100)
   *
   * Measures if rep is performed at optimal tempo.
   * Future enhancement for detailed scoring.
   *
   * Optimal squat tempo: ~2-3 seconds total
   * - Too fast = momentum/bouncing
   * - Too slow = fatigue/grinding
   *
   * @param totalDuration - Total rep duration (ms)
   * @returns Score from 0-100
   */
  private calculateTempoScore(totalDuration: number): number {
    const durationSeconds = totalDuration / 1000;

    // Optimal range: 2-3 seconds
    if (durationSeconds >= 2 && durationSeconds <= 3) return 100;
    if (durationSeconds >= 1.5 && durationSeconds <= 4) return 85;
    if (durationSeconds >= 1 && durationSeconds <= 5) return 65;

    // Too fast or too slow
    return 40;
  }
}
