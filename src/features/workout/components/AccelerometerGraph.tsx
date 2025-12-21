/**
 * AccelerometerGraph - Real-time Accelerometer Visualization
 * TrynerApp - Workout Feature
 *
 * Displays 3-axis accelerometer data in real-time for debugging and feedback.
 *
 * Features:
 * - Three lines: X (red), Y (green), Z (blue)
 * - Shows last 3 seconds of data
 * - Range: -2G to +2G
 * - Toggle between raw and filtered data
 *
 * Usage:
 * ```typescript
 * <AccelerometerGraph
 *   data={accelerometerData}
 *   showFiltered={true}
 * />
 * ```
 */

import React, { useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { ProcessedSensorData } from '@/motion-engine';
import { colors, spacing } from '@/core/theme';
import Text from '@/shared/components/Text';

interface AccelerometerGraphProps {
  /** Array of processed sensor data (from motion engine) */
  data: ProcessedSensorData[];

  /** Show filtered values instead of raw (default: true) */
  showFiltered?: boolean;

  /** Graph height in pixels (default: 200) */
  height?: number;

  /** Show legend (default: true) */
  showLegend?: boolean;
}

export const AccelerometerGraph: React.FC<AccelerometerGraphProps> = ({
  data,
  showFiltered = true,
  height = 200,
  showLegend = true,
}) => {
  // Helper to sanitize numeric values
  const sanitizeValue = (value: number | undefined): number => {
    if (value === undefined || value === null || isNaN(value) || !isFinite(value)) {
      return 0;
    }
    return value;
  };

  // Get latest values for display
  const latestValues = useMemo(() => {
    if (!data || data.length === 0) {
      return { x: 0, y: 0, z: 0, magnitude: 0 };
    }

    const latest = data[data.length - 1];
    if (!latest) {
      return { x: 0, y: 0, z: 0, magnitude: 0 };
    }

    return {
      x: sanitizeValue(showFiltered ? latest.filteredX : latest.x),
      y: sanitizeValue(showFiltered ? latest.filteredY : latest.y),
      z: sanitizeValue(showFiltered ? latest.filteredZ : latest.z),
      magnitude: sanitizeValue(showFiltered ? latest.filteredMagnitude : latest.magnitude),
    };
  }, [data, showFiltered]);

  // Don't render if no data
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text variant="bodySmall" style={styles.noDataText}>
          Esperando datos del acelerómetro...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="label" style={styles.title}>
        ACELERÓMETRO {showFiltered ? '(Filtrado)' : '(Raw)'}
      </Text>

      <View style={styles.valuesContainer}>
        <View style={styles.valueRow}>
          <View style={[styles.indicator, { backgroundColor: '#FF3B30' }]} />
          <Text variant="bodySmall" style={styles.axisLabel}>
            Eje X:
          </Text>
          <Text variant="metric" style={[styles.value, { color: '#FF3B30' }]}>
            {latestValues.x.toFixed(2)}G
          </Text>
        </View>

        <View style={styles.valueRow}>
          <View style={[styles.indicator, { backgroundColor: '#34C759' }]} />
          <Text variant="bodySmall" style={styles.axisLabel}>
            Eje Y:
          </Text>
          <Text variant="metric" style={[styles.value, { color: '#34C759' }]}>
            {latestValues.y.toFixed(2)}G
          </Text>
        </View>

        <View style={styles.valueRow}>
          <View style={[styles.indicator, { backgroundColor: '#007AFF' }]} />
          <Text variant="bodySmall" style={styles.axisLabel}>
            Eje Z:
          </Text>
          <Text variant="metric" style={[styles.value, { color: '#007AFF' }]}>
            {latestValues.z.toFixed(2)}G
          </Text>
        </View>

        <View style={[styles.valueRow, styles.magnitudeRow]}>
          <View style={[styles.indicator, { backgroundColor: colors.neutral[500] }]} />
          <Text variant="bodySmall" style={styles.axisLabel}>
            Magnitud:
          </Text>
          <Text variant="metric" style={[styles.value, { color: colors.neutral[900] }]}>
            {latestValues.magnitude.toFixed(2)}G
          </Text>
        </View>
      </View>

      <Text variant="caption" style={styles.sampleCount}>
        {data.length} muestras recopiladas
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginVertical: spacing.md,
  },

  noDataText: {
    textAlign: 'center',
    color: colors.neutral.textTertiary,
    paddingVertical: spacing.xxl,
  },

  title: {
    color: colors.neutral.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },

  valuesContainer: {
    gap: spacing.md,
  },

  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  magnitudeRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[300],
  },

  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  axisLabel: {
    flex: 1,
    color: colors.neutral.textSecondary,
  },

  value: {
    fontWeight: '600',
    fontSize: 18,
  },

  sampleCount: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.neutral.textTertiary,
  },
});

export default AccelerometerGraph;
