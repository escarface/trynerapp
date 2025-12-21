import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Vibration,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
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
import { updateUser } from '@/core/database';
import { useOnboardingStore } from '@/features/onboarding/stores/onboardingStore';
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
        {currentStep} de {totalSteps}
      </Text>
    </View>
  );
};

export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { updateUser: updateUserInStore, user } = useAuthStore();
  
  const {
    data,
    currentStep,
    totalSteps,
    updateData,
    nextStep: storeNextStep,
    reset,
    // prevStep
  } = useOnboardingStore();

  // Local derived state for inputs (handling strings vs numbers)
  const [ageInput, setAgeInput] = useState(data.age?.toString() || '');
  const [weightInput, setWeightInput] = useState(data.weight?.toString() || '');
  const [heightInput, setHeightInput] = useState(data.height?.toString() || '');

  // Sync local input state when store data changes (e.g. if coming back)
  useEffect(() => {
    if (data.age) setAgeInput(data.age.toString());
    if (data.weight) setWeightInput(data.weight.toString());
    if (data.height) setHeightInput(data.height.toString());
  }, [data.age, data.weight, data.height]);

  const slideX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
    opacity: opacity.value,
  }));

  const handleNext = () => {
    // Dismiss keyboard first
    Keyboard.dismiss();

    // Save current step data before moving
    if (currentStep === 0) { // Step 0 in store is Step 1 in UI (Welcome/Basics)
       updateData({
         age: ageInput ? parseInt(ageInput) : undefined,
         weight: weightInput ? parseFloat(weightInput) : undefined,
         height: heightInput ? parseInt(heightInput) : undefined,
       });
    }

    if (currentStep < totalSteps - 1) { // totalSteps is 5, last index is 4
      // Slide out animation
      slideX.value = withSpring(-SCREEN_WIDTH, SPRING_CONFIG);
      opacity.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(storeNextStep)();
        slideX.value = SCREEN_WIDTH;
        opacity.value = 0;
        slideX.value = withSpring(0, SPRING_CONFIG);
        opacity.value = withTiming(1, { duration: 300 });
      });
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    if (!user) return;

    // Dismiss keyboard first
    Keyboard.dismiss();

    try {
      // Default values for skipped onboarding
      const defaultData = {
        age: undefined,
        weight: undefined,
        height: undefined,
        fitness_level: 'intermediate' as const,
        goal: 'general_health' as const,
      };

      // Update database with defaults
      await updateUser(user.id, defaultData);

      // Update AuthStore
      updateUserInStore(defaultData);

      // Reset onboarding store
      reset();

      // Navigation will happen automatically via RootNavigator
    } catch (error) {
      console.error('Skip onboarding error:', error);
      Alert.alert('Error', 'No pudimos completar el proceso. Intenta de nuevo.');
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      // Update database
      await updateUser(user.id, {
        age: data.age,
        weight: data.weight,
        height: data.height,
        fitness_level: data.fitnessLevel,
        goal: data.goal,
      });
      
      // Update AuthStore
      updateUserInStore({
        age: data.age,
        weight: data.weight,
        height: data.height,
        fitness_level: data.fitnessLevel,
        goal: data.goal,
      });

      // Reset onboarding store for next time
      reset();

      // Navigation will happen automatically via RootNavigator
      // Since isAuthenticated is true and data is saved
    } catch (error) {
      console.error('Onboarding completion error:', error);
      Alert.alert('Error', 'No pudimos guardar tu información. Intenta de nuevo.');
    }
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return ageInput.length > 0 && weightInput.length > 0 && heightInput.length > 0;
    }
    if (currentStep === 1) {
      return data.fitnessLevel !== undefined;
    }
    if (currentStep === 2) {
      return data.goal !== undefined;
    }
    return false;
  };

  const renderStep1 = () => (
    <Animated.View style={[styles.stepContainer, animatedSlideStyle]}>
      <View style={styles.stepHeader}>
        <Text variant="display" style={styles.stepTitle}>
          Empecemos con
        </Text>
        <LinearGradient
          colors={[colors.primary[500], colors.primary[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.titleAccent}
        >
          <Text variant="display" style={styles.stepTitleAccent}>
            lo básico
          </Text>
        </LinearGradient>
      </View>

      <Text variant="bodyLarge" style={styles.stepDescription}>
        Necesitamos algunos detalles para personalizar tu entrenamiento
      </Text>

      <View style={styles.inputsContainer}>
        <Input
          label="EDAD"
          placeholder="25"
          keyboardType="numeric"
          value={ageInput}
          onChangeText={setAgeInput}
          maxLength={3}
          containerStyle={styles.input}
          returnKeyType="next"
          blurOnSubmit={false}
        />

        <View style={styles.inputRow}>
          <Input
            label="PESO (KG)"
            placeholder="70.5"
            keyboardType="decimal-pad"
            value={weightInput}
            onChangeText={setWeightInput}
            containerStyle={styles.inputHalf}
            returnKeyType="next"
            blurOnSubmit={false}
          />

          <Input
            label="ALTURA (CM)"
            placeholder="175"
            keyboardType="numeric"
            value={heightInput}
            onChangeText={setHeightInput}
            maxLength={3}
            containerStyle={styles.inputHalf}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
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
            TU PERFIL
          </Text>
          <Text variant="h2" style={styles.dataValue}>
            {ageInput || '--'} años • {weightInput || '--'} kg • {heightInput || '--'} cm
          </Text>
        </LinearGradient>
      </View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View style={[styles.stepContainer, animatedSlideStyle]}>
      <View style={styles.stepHeader}>
        <Text variant="display" style={styles.stepTitle}>
          Tu nivel de
        </Text>
        <LinearGradient
          colors={[colors.success[400], colors.success[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.titleAccent}
        >
          <Text variant="display" style={styles.stepTitleAccent}>
            fitness
          </Text>
        </LinearGradient>
      </View>

      <Text variant="bodyLarge" style={styles.stepDescription}>
        Esto nos ayuda a calibrar tus entrenamientos
      </Text>

      <View style={styles.cardsContainer}>
        <SelectionCard
          title="Principiante"
          subtitle="Nuevo en entrenamiento"
          icon="🌱"
          gradient={[colors.success[400], colors.success[500], colors.success[600]]}
          isSelected={data.fitnessLevel === 'beginner'}
          onSelect={() => updateData({ fitnessLevel: 'beginner' })}
          delay={0}
        />

        <SelectionCard
          title="Intermedio"
          subtitle="Entreno regularmente"
          icon="💪"
          gradient={[colors.primary[400], colors.primary[500], colors.primary[600]]}
          isSelected={data.fitnessLevel === 'intermediate'}
          onSelect={() => updateData({ fitnessLevel: 'intermediate' })}
          delay={100}
        />

        <SelectionCard
          title="Avanzado"
          subtitle="Enfoque en rendimiento"
          icon="🔥"
          gradient={['#FF6B35', '#FF8C42', '#FFA94D']}
          isSelected={data.fitnessLevel === 'advanced'}
          onSelect={() => updateData({ fitnessLevel: 'advanced' })}
          delay={200}
        />
      </View>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View style={[styles.stepContainer, animatedSlideStyle]}>
      <View style={styles.stepHeader}>
        <Text variant="display" style={styles.stepTitle}>
          Tu objetivo de
        </Text>
        <LinearGradient
          colors={['#FF6B35', '#FFA94D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.titleAccent}
        >
          <Text variant="display" style={styles.stepTitleAccent}>
            entrenamiento
          </Text>
        </LinearGradient>
      </View>

      <Text variant="bodyLarge" style={styles.stepDescription}>
        ¿Qué quieres lograr?
      </Text>

      <View style={styles.cardsContainer}>
        <SelectionCard
          title="Fuerza"
          subtitle="Desarrollar poder máximo"
          icon="🏋️"
          gradient={[colors.primary[500], colors.primary[600], '#5A3FFF']}
          isSelected={data.goal === 'strength'}
          onSelect={() => updateData({ goal: 'strength' })}
          delay={0}
        />

        <SelectionCard
          title="Hipertrofia"
          subtitle="Crecimiento muscular"
          icon="💪"
          gradient={['#9D4EDD', '#C77DFF', '#E0AAFF']}
          isSelected={data.goal === 'hypertrophy'}
          onSelect={() => updateData({ goal: 'hypertrophy' })}
          delay={100}
        />

        <SelectionCard
          title="Resistencia"
          subtitle="Acondicionamiento atlético"
          icon="🏃"
          gradient={['#FF6B35', '#FF8C42', '#FFA94D']}
          isSelected={data.goal === 'endurance'}
          onSelect={() => updateData({ goal: 'endurance' })}
          delay={200}
        />
      </View>
    </Animated.View>
  );

  return (
    <Screen safeAreaEdges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            {/* Skip button */}
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text variant="bodySmall" style={styles.skipText}>
                Saltar
              </Text>
            </TouchableOpacity>

            {/* Progress indicator */}
            <ProgressIndicator currentStep={currentStep + 1} totalSteps={3} />

            {/* Scrollable Steps Content */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.contentContainer}>
                {currentStep === 0 && renderStep1()}
                {currentStep === 1 && renderStep2()}
                {currentStep === 2 && renderStep3()}
              </View>
            </ScrollView>

            {/* Bottom CTA */}
            <View style={styles.ctaContainer}>
              <Button
                title={currentStep === 2 ? 'Empezar entrenamiento' : 'Continuar'}
                variant="primary"
                size="large"
                fullWidth
                disabled={!canProceed()}
                onPress={handleNext}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },

  scrollView: {
    flex: 1,
  },

  scrollViewContent: {
    flexGrow: 1,
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
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
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
