import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Text from '../Text/Text';
import { colors, spacing } from '@/core/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CircularProgressProps {
  /** Progress value (0-100) */
  value: number;
  /** Size of the circle */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Color based on score */
  color?: string;
  /** Label to display below value */
  label?: string;
  /** Animate on mount */
  animated?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 160,
  strokeWidth = 12,
  color,
  label,
  animated = true,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Determine color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 85) return colors.score.excellent.color;
    if (score >= 70) return colors.score.optimal.color;
    if (score >= 50) return colors.score.good.color;
    return colors.score.acceptable.color;
  };

  const progressColor = color || getScoreColor(value);

  const getScoreLabel = (score: number): string => {
    if (score >= 85) return colors.score.excellent.label;
    if (score >= 70) return colors.score.optimal.label;
    if (score >= 50) return colors.score.good.label;
    return colors.score.acceptable.label;
  };

  const scoreLabel = label || getScoreLabel(value);

  useEffect(() => {
    if (animated) {
      Animated.spring(animatedValue, {
        toValue: value,
        speed: 8,
        bounciness: 6,
        useNativeDriver: true,
      }).start();
    } else {
      animatedValue.setValue(value);
    }
  }, [value, animated]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.neutral[200]}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      {/* Center Content */}
      <View style={styles.centerContent}>
        <Animated.Text
          style={[
            styles.valueText,
            {
              color: progressColor,
              opacity: animatedValue.interpolate({
                inputRange: [0, 100],
                outputRange: [0.3, 1],
              }),
            },
          ]}
        >
          {Math.round(value)}
        </Animated.Text>
        <Text variant="caption" style={styles.labelText}>
          {scoreLabel}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },

  valueText: {
    fontSize: 64,
    fontWeight: '800',
    lineHeight: 72,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },

  labelText: {
    marginTop: spacing.xs,
    color: colors.neutral.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default CircularProgress;
