import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Vibration,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Screen from '@/shared/components/Screen';
import Text from '@/shared/components/Text';
import Button from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { colors, spacing, typography } from '@/core/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { updateUserProfile } from '@/core/database';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 90,
  mass: 1,
};

type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
type Goal = 'strength' | 'hypertrophy' | 'endurance';

interface SelectionCardProps {
  title: string;
  subtitle: string;
  icon: string;
  gradient: string[];
  isSelected: boolean;
  onSelect: () => void;
  delay?: number;
}

const SelectionCard: React.FC<SelectionCardProps> = ({
  title,
  subtitle,
  icon,
  gradient,
  isSelected,
  onSelect,
  delay = 0,
}) => {
  const scale = useSharedValue(0.9);
  const glow = useSharedValue(0);

  useEffect(() => {
    // Stagger animation with setTimeout
    const timer = setTimeout(() => {
      scale.value = withSpring(1, SPRING_CONFIG);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    glow.value = withSpring(isSelected ? 1 : 0, SPRING_CONFIG);
    scale.value = withSpring(isSelected ? 1.02 : 1, SPRING_CONFIG);
  }, [isSelected]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glow.value * 0.6,
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.95, 1.05]) }],
  }));

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }, () => {
      scale.value = withSpring(isSelected ? 1.02 : 1, SPRING_CONFIG);
    });
    onSelect();
  };

  return (
    <TouchableOpacity activeOpacity={1} onPress={handlePress}>
      <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
        {/* Glow effect */}
        <Animated.View style={[styles.glowContainer, animatedGlowStyle]}>
          <LinearGradient
            colors={gradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glow}
          />
        </Animated.View>

        {/* Card content */}
        <LinearGradient
          colors={(isSelected ? gradient : ['#FFFFFF', '#F8F9FA']) as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {!isSelected && (
            <View style={styles.cardBorder} />
          )}

          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.cardIcon}>{icon}</Text>
            </View>

            <Text
              variant="h3"
              style={[
                styles.cardTitle,
                isSelected && styles.cardTitleSelected,
              ]}
            >
              {title}
            </Text>

            <Text
              variant="bodySmall"
              style={[
                styles.cardSubtitle,
                isSelected && styles.cardSubtitleSelected,
              ]}
            >
              {subtitle}
            </Text>

            {/* Selection indicator */}
            <View style={styles.selectionIndicatorContainer}>
              <Animated.View
                style={[
                  styles.selectionIndicator,
                  isSelected && styles.selectionIndicatorActive,
                ]}
              >
                {isSelected && <View style={styles.selectionDot} />}
              </Animated.View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(currentStep / totalSteps, SPRING_CONFIG);
  }, [currentStep]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressSteps}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.progressDot,
              index < currentStep && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBar, animatedProgressStyle]}>
          <LinearGradient
            colors={[colors.primary[400], colors.primary[600], colors.success[500]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressGradient}
          />
        </Animated.View>
      </View>

      <Text variant="caption" style={styles.progressText}>
        {currentStep} of {totalSteps}
      </Text>
    </View>
  );
};

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { updateUser, user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);

  const slideX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
    opacity: opacity.value,
  }));

  const handleNext = () => {
    if (currentStep < 3) {
      // Slide out animation
      slideX.value = withSpring(-SCREEN_WIDTH, SPRING_CONFIG);
      opacity.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(setCurrentStep)(currentStep + 1);
        slideX.value = SCREEN_WIDTH;
        opacity.value = 0;
        slideX.value = withSpring(0, SPRING_CONFIG);
        opacity.value = withTiming(1, { duration: 300 });
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    // Navigate to main app
    // In AuthNavigator, onboarding completion should redirect to main
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      // Update database
      await updateUserProfile(user.id, {
        age: age ? parseInt(age) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseInt(height) : undefined,
        fitnessLevel: fitnessLevel || undefined,
        goal: goal || undefined,
      });

      // Navigation will happen automatically via RootNavigator
      // Since isAuthenticated is true and data is saved
    } catch (error) {
      console.error('Onboarding completion error:', error);
      Alert.alert('Error', 'No pudimos guardar tu información. Intenta de nuevo.');
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return age && weight && height;
    }
    if (currentStep === 2) {
      return fitnessLevel !== null;
    }
    if (currentStep === 3) {
      return goal !== null;
    }
    return false;
  };

  const renderStep1 = () => (
    <Animated.View style={[styles.stepContainer, animatedSlideStyle]}>
      <View style={styles.stepHeader}>
        <Text variant="display" style={styles.stepTitle}>
          Let's start with
        </Text>
        <LinearGradient
          colors={[colors.primary[500], colors.primary[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.titleAccent}
        >
          <Text variant="display" style={styles.stepTitleAccent}>
            the basics
          </Text>
        </LinearGradient>
      </View>

      <Text variant="bodyLarge" style={styles.stepDescription}>
        We need a few details to personalize your training
      </Text>

      <View style={styles.inputsContainer}>
        <Input
          label="AGE"
          placeholder="25"
          keyboardType="numeric"
          value={age}
          onChangeText={setAge}
          maxLength={3}
          containerStyle={styles.input}
        />

        <View style={styles.inputRow}>
          <Input
            label="WEIGHT (KG)"
            placeholder="70.5"
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
            containerStyle={styles.inputHalf}
          />

          <Input
            label="HEIGHT (CM)"
            placeholder="175"
            keyboardType="numeric"
            value={height}
            onChangeText={setHeight}
            maxLength={3}
            containerStyle={styles.inputHalf}
          />
        </View>
      </View>

      <View style={styles.dataVisualization}>
        <LinearGradient
          colors={['rgba(45, 78, 255, 0.1)', 'rgba(0, 217, 126, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.dataCard}
        >
          <Text variant="caption" style={styles.dataLabel}>
            YOUR PROFILE
          </Text>
          <Text variant="h2" style={styles.dataValue}>
            {age || '--'} yrs • {weight || '--'} kg • {height || '--'} cm
          </Text>
        </LinearGradient>
      </View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View style={[styles.stepContainer, animatedSlideStyle]}>
      <View style={styles.stepHeader}>
        <Text variant="display" style={styles.stepTitle}>
          Your fitness
        </Text>
        <LinearGradient
          colors={[colors.success[400], colors.success[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.titleAccent}
        >
          <Text variant="display" style={styles.stepTitleAccent}>
            level
          </Text>
        </LinearGradient>
      </View>

      <Text variant="bodyLarge" style={styles.stepDescription}>
        This helps us calibrate your workouts
      </Text>

      <View style={styles.cardsContainer}>
        <SelectionCard
          title="Beginner"
          subtitle="New to fitness training"
          icon="🌱"
          gradient={[colors.success[400], colors.success[500], colors.success[600]]}
          isSelected={fitnessLevel === 'beginner'}
          onSelect={() => setFitnessLevel('beginner')}
          delay={0}
        />

        <SelectionCard
          title="Intermediate"
          subtitle="Training consistently"
          icon="💪"
          gradient={[colors.primary[400], colors.primary[500], colors.primary[600]]}
          isSelected={fitnessLevel === 'intermediate'}
          onSelect={() => setFitnessLevel('intermediate')}
          delay={100}
        />

        <SelectionCard
          title="Advanced"
          subtitle="Athletic performance focus"
          icon="🔥"
          gradient={['#FF6B35', '#FF8C42', '#FFA94D']}
          isSelected={fitnessLevel === 'advanced'}
          onSelect={() => setFitnessLevel('advanced')}
          delay={200}
        />
      </View>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View style={[styles.stepContainer, animatedSlideStyle]}>
      <View style={styles.stepHeader}>
        <Text variant="display" style={styles.stepTitle}>
          Your training
        </Text>
        <LinearGradient
          colors={['#FF6B35', '#FFA94D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.titleAccent}
        >
          <Text variant="display" style={styles.stepTitleAccent}>
            goal
          </Text>
        </LinearGradient>
      </View>

      <Text variant="bodyLarge" style={styles.stepDescription}>
        What do you want to achieve?
      </Text>

      <View style={styles.cardsContainer}>
        <SelectionCard
          title="Strength"
          subtitle="Build maximum power"
          icon="🏋️"
          gradient={[colors.primary[500], colors.primary[600], '#5A3FFF']}
          isSelected={goal === 'strength'}
          onSelect={() => setGoal('strength')}
          delay={0}
        />

        <SelectionCard
          title="Hypertrophy"
          subtitle="Muscle growth & size"
          icon="💪"
          gradient={['#9D4EDD', '#C77DFF', '#E0AAFF']}
          isSelected={goal === 'hypertrophy'}
          onSelect={() => setGoal('hypertrophy')}
          delay={100}
        />

        <SelectionCard
          title="Endurance"
          subtitle="Athletic conditioning"
          icon="🏃"
          gradient={['#FF6B35', '#FF8C42', '#FFA94D']}
          isSelected={goal === 'endurance'}
          onSelect={() => setGoal('endurance')}
          delay={200}
        />
      </View>
    </Animated.View>
  );

  return (
    <Screen safeAreaEdges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Skip button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text variant="bodySmall" style={styles.skipText}>
            Skip
          </Text>
        </TouchableOpacity>

        {/* Progress indicator */}
        <ProgressIndicator currentStep={currentStep} totalSteps={3} />

        {/* Steps */}
        <View style={styles.contentContainer}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </View>

        {/* Bottom CTA */}
        <View style={styles.ctaContainer}>
          <Button
            title={currentStep === 3 ? 'Start Training' : 'Continue'}
            variant="primary"
            size="large"
            fullWidth
            disabled={!canProceed()}
            onPress={handleNext}
          />
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },

  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? spacing.lg : spacing.md,
    right: spacing.lg,
    zIndex: 10,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },

  skipText: {
    color: colors.neutral.textTertiary,
    fontWeight: '600',
  },

  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? spacing.xxl : spacing.xl,
    paddingBottom: spacing.lg,
  },

  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral[300],
  },

  progressDotActive: {
    backgroundColor: colors.primary[500],
    width: 24,
  },

  progressBarContainer: {
    height: 4,
    backgroundColor: colors.neutral[200],
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },

  progressBar: {
    height: '100%',
  },

  progressGradient: {
    flex: 1,
  },

  progressText: {
    textAlign: 'center',
    color: colors.neutral.textTertiary,
    fontWeight: '600',
    letterSpacing: 1,
  },

  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },

  stepContainer: {
    flex: 1,
  },

  stepHeader: {
    marginBottom: spacing.md,
  },

  stepTitle: {
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },

  titleAccent: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },

  stepTitleAccent: {
    color: colors.neutral.white,
  },

  stepDescription: {
    color: colors.neutral.textSecondary,
    marginBottom: spacing.xl,
  },

  inputsContainer: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },

  input: {
    marginBottom: 0,
  },

  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  inputHalf: {
    flex: 1,
  },

  dataVisualization: {
    marginTop: spacing.lg,
  },

  dataCard: {
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },

  dataLabel: {
    color: colors.primary[700],
    fontWeight: '700',
    marginBottom: spacing.xs,
    letterSpacing: 1.2,
  },

  dataValue: {
    color: colors.neutral[900],
  },

  cardsContainer: {
    gap: spacing.md,
  },

  cardContainer: {
    position: 'relative',
  },

  glowContainer: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 20,
    zIndex: 0,
  },

  glow: {
    flex: 1,
    borderRadius: 20,
    opacity: 0.4,
  },

  card: {
    borderRadius: 16,
    padding: spacing.lg,
    minHeight: 120,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.neutral[900],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  cardBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
  },

  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardIcon: {
    fontSize: 32,
  },

  cardTitle: {
    flex: 1,
    color: colors.neutral[900],
  },

  cardTitleSelected: {
    color: colors.neutral.white,
  },

  cardSubtitle: {
    position: 'absolute',
    bottom: -24,
    left: 72,
    color: colors.neutral.textSecondary,
  },

  cardSubtitleSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },

  selectionIndicatorContainer: {
    marginLeft: 'auto',
  },

  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[400],
    backgroundColor: colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
  },

  selectionIndicatorActive: {
    borderColor: colors.neutral.white,
    backgroundColor: colors.neutral.white,
  },

  selectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary[600],
  },

  ctaContainer: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    backgroundColor: colors.neutral.background,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
});

export default OnboardingScreen;
