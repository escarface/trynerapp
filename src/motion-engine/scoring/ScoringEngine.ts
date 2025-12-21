/**
 * Scoring Engine - Calculate Overall Rep Quality
 * TrynerApp - Motion Engine
 *
 * Calculates overall quality score and technique rating from rep features.
 *
 * MVP Scoring:
 * - Simple weighted average of depth, stability, consistency
 * - Maps score to technique label (excellent, optimal, good, acceptable, poor)
 *
 * Future enhancements:
 * - Historical comparison (consistency across sets)
 * - Personalized scoring based on user's baseline
 * - Form feedback (specific technique corrections)
 */

import { RepFeatures, RepScore } from '../types';
import { getScoreTechnique } from '../core/constants';

interface ScoringWeights {
  depth: number;        // Default: 0.5 (most important)
  stability: number;    // Default: 0.3
  consistency: number;  // Default: 0.2
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  depth: 0.5,       // 50% - Range of motion is most critical
  stability: 0.3,   // 30% - Movement control matters
  consistency: 0.2, // 20% - Consistency across reps (MVP: simplified)
};

export class ScoringEngine {
  private weights: ScoringWeights;

  /**
   * @param weights - Optional custom scoring weights (must sum to 1.0)
   */
  constructor(weights: ScoringWeights = DEFAULT_WEIGHTS) {
    this.validateWeights(weights);
    this.weights = weights;
  }

  /**
   * Calculate overall score from rep features
   *
   * @param features - Extracted rep features
   * @returns RepScore with overall score and technique label
   */
  score(features: RepFeatures): RepScore {
    // Extract individual scores and sanitize to prevent NaN
    const depth = this.sanitizeScore(features.depthScore);
    const stability = this.sanitizeScore(features.stabilityScore);
    const consistency = this.sanitizeScore(features.rangeScore); // MVP: using rangeScore as consistency

    // Calculate weighted average
    const overall = this.calculateWeightedScore(depth, stability, consistency);

    // Determine technique label
    const technique = getScoreTechnique(overall);

    return {
      overall: Math.round(overall),
      depth: Math.round(depth),
      stability: Math.round(stability),
      consistency: Math.round(consistency),
      technique,
    };
  }

  /**
   * Sanitize score value to prevent NaN
   * @param score - Raw score value
   * @returns Safe score value (0-100)
   */
  private sanitizeScore(score: number): number {
    if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) {
      return 0;
    }
    return Math.max(0, Math.min(100, score)); // Clamp between 0-100
  }

  /**
   * Calculate weighted average score
   *
   * @param depth - Depth score (0-100)
   * @param stability - Stability score (0-100)
   * @param consistency - Consistency score (0-100)
   * @returns Weighted overall score (0-100)
   */
  private calculateWeightedScore(
    depth: number,
    stability: number,
    consistency: number
  ): number {
    return (
      depth * this.weights.depth +
      stability * this.weights.stability +
      consistency * this.weights.consistency
    );
  }

  /**
   * Validate that weights sum to 1.0 (within tolerance)
   *
   * @param weights - Weights to validate
   * @throws Error if weights don't sum to 1.0
   */
  private validateWeights(weights: ScoringWeights): void {
    const sum = weights.depth + weights.stability + weights.consistency;
    const tolerance = 0.001;

    if (Math.abs(sum - 1.0) > tolerance) {
      throw new Error(
        `ScoringEngine: Weights must sum to 1.0 (got ${sum}). ` +
        `depth=${weights.depth}, stability=${weights.stability}, consistency=${weights.consistency}`
      );
    }
  }

  /**
   * Update scoring weights
   *
   * Useful for:
   * - Emphasizing different aspects for different exercises
   * - Personalizing scoring based on user goals
   * - A/B testing different scoring formulas
   *
   * @param weights - New weights (must sum to 1.0)
   */
  setWeights(weights: ScoringWeights): void {
    this.validateWeights(weights);
    this.weights = weights;
  }

  /**
   * Get current weights
   */
  getWeights(): ScoringWeights {
    return { ...this.weights };
  }

  /**
   * Calculate average score from multiple reps
   *
   * @param scores - Array of RepScore objects
   * @returns Average RepScore
   */
  calculateAverageScore(scores: RepScore[]): RepScore {
    if (scores.length === 0) {
      return {
        overall: 0,
        depth: 0,
        stability: 0,
        consistency: 0,
        technique: 'poor',
      };
    }

    const sum = scores.reduce(
      (acc, score) => ({
        overall: acc.overall + (this.sanitizeScore(score.overall)),
        depth: acc.depth + (this.sanitizeScore(score.depth)),
        stability: acc.stability + (this.sanitizeScore(score.stability)),
        consistency: acc.consistency + (this.sanitizeScore(score.consistency)),
      }),
      { overall: 0, depth: 0, stability: 0, consistency: 0 }
    );

    const avg = {
      overall: Math.round(sum.overall / scores.length),
      depth: Math.round(sum.depth / scores.length),
      stability: Math.round(sum.stability / scores.length),
      consistency: Math.round(sum.consistency / scores.length),
    };

    return {
      ...avg,
      technique: getScoreTechnique(avg.overall),
    };
  }
}
