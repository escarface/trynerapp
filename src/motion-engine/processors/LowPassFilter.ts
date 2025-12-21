/**
 * Low-Pass Filter - Exponential Moving Average
 * TrynerApp - Motion Engine
 *
 * Reduces high-frequency noise from accelerometer readings
 * while preserving the underlying motion signal.
 *
 * Algorithm: Exponential Moving Average (EMA)
 *   filtered_x = alpha × raw_x + (1 - alpha) × previous_filtered_x
 *
 * Alpha tuning:
 * - Lower alpha (0.1): Smoother, more lag
 * - Higher alpha (0.5): More responsive, noisier
 * - Default (0.22): Balanced for squat detection
 */

export class LowPassFilter {
  private alpha: number;
  private previousX: number = 0;
  private previousY: number = 0;
  private previousZ: number = 0;
  private isInitialized: boolean = false;

  /**
   * @param alpha - Smoothing factor (0-1). Default: 0.22
   *                Lower = smoother but more lag
   *                Higher = more responsive but noisier
   */
  constructor(alpha: number = 0.22) {
    if (alpha < 0 || alpha > 1) {
      throw new Error('LowPassFilter: alpha must be between 0 and 1');
    }
    this.alpha = alpha;
  }

  /**
   * Apply low-pass filter to raw accelerometer values
   *
   * First call initializes the filter with raw values (no lag)
   * Subsequent calls apply exponential moving average
   *
   * @param rawX - Raw X-axis acceleration (G)
   * @param rawY - Raw Y-axis acceleration (G)
   * @param rawZ - Raw Z-axis acceleration (G)
   * @returns Filtered [x, y, z] values
   */
  filter(rawX: number, rawY: number, rawZ: number): [number, number, number] {
    // First call: Initialize with raw values (no smoothing on first sample)
    if (!this.isInitialized) {
      this.previousX = rawX;
      this.previousY = rawY;
      this.previousZ = rawZ;
      this.isInitialized = true;
      return [rawX, rawY, rawZ];
    }

    // Apply exponential moving average
    const filteredX = this.alpha * rawX + (1 - this.alpha) * this.previousX;
    const filteredY = this.alpha * rawY + (1 - this.alpha) * this.previousY;
    const filteredZ = this.alpha * rawZ + (1 - this.alpha) * this.previousZ;

    // Store for next iteration
    this.previousX = filteredX;
    this.previousY = filteredY;
    this.previousZ = filteredZ;

    return [filteredX, filteredY, filteredZ];
  }

  /**
   * Reset filter state (useful when starting new workout session)
   */
  reset(): void {
    this.previousX = 0;
    this.previousY = 0;
    this.previousZ = 0;
    this.isInitialized = false;
  }

  /**
   * Update alpha coefficient (for runtime tuning)
   * @param alpha - New smoothing factor (0-1)
   */
  setAlpha(alpha: number): void {
    if (alpha < 0 || alpha > 1) {
      throw new Error('LowPassFilter: alpha must be between 0 and 1');
    }
    this.alpha = alpha;
  }

  /**
   * Get current alpha value
   */
  getAlpha(): number {
    return this.alpha;
  }

  /**
   * Check if filter has been initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}
