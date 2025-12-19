import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Platform, ScrollView } from 'react-native';
import Screen from '@/shared/components/Screen';
import Text from '@/shared/components/Text';
import Button from '@/shared/components/Button';
import CircularProgress from '@/shared/components/CircularProgress/CircularProgress';
import StatCard from '@/shared/components/StatCard/StatCard';
import { spacing, colors, borderRadius } from '@/core/theme';
import { useAuthStore } from '@/features/auth/store/authStore';

export const HomeScreen = () => {
  const { user } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Mock data - En el futuro vendrá de la base de datos
  const todayScore = 85;
  const totalExercises = 12;
  const caloriesBurned = 450;
  const activeMinutes = 45;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        speed: 12,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <Screen safeAreaEdges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View>
            <Text variant="overline" style={styles.greetingText}>
              {getGreeting()}
            </Text>
            <Text variant="h2" style={styles.nameText}>
              {user?.name || 'Usuario'}
            </Text>
          </View>
          <TouchableOpacity style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Score Card */}
        <Animated.View
          style={[
            styles.scoreCard,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 30],
                    outputRange: [0, 20],
                  }),
                },
              ],
            },
          ]}
        >
          <Text variant="label" style={styles.scoreCardLabel}>
            RENDIMIENTO DE HOY
          </Text>
          <View style={styles.scoreCircleContainer}>
            <CircularProgress value={todayScore} size={180} strokeWidth={14} />
          </View>
          <Text variant="bodySmall" style={styles.scoreDescription}>
            {todayScore >= 85
              ? '¡Increíble rendimiento! Sigue así 🔥'
              : todayScore >= 70
              ? 'Buen trabajo, mantén el ritmo 💪'
              : 'Puedes hacerlo mejor, ¡vamos! 🚀'}
          </Text>
        </Animated.View>

        {/* Mini Stats */}
        <Animated.View
          style={[
            styles.statsGrid,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 30],
                    outputRange: [0, 10],
                  }),
                },
              ],
            },
          ]}
        >
          <StatCard
            icon="💪"
            value={totalExercises}
            label="Ejercicios"
            accentColor={colors.primary[500]}
            style={styles.statCard}
          />
          <StatCard
            icon="🔥"
            value={caloriesBurned}
            label="Kcal"
            accentColor={colors.warning[500]}
            style={styles.statCard}
          />
          <StatCard
            icon="⏱️"
            value={activeMinutes}
            label="Minutos"
            accentColor={colors.success[500]}
            style={styles.statCard}
          />
        </Animated.View>

        {/* CTA Button */}
        <Animated.View
          style={[
            styles.ctaContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Button
            title="Comenzar Entrenamiento"
            variant="primary"
            fullWidth
            style={styles.ctaButton}
            leftIcon={<Text style={styles.ctaIcon}>🎯</Text>}
          />
        </Animated.View>

        {/* Recent Activity Section */}
        <Animated.View
          style={[
            styles.recentSection,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.6],
              }),
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text variant="h4">Actividad Reciente</Text>
            <TouchableOpacity>
              <Text variant="bodySmall" style={styles.seeAllText}>
                Ver todo
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📊</Text>
            <Text variant="body" style={styles.emptyStateText}>
              Aún no tienes entrenamientos
            </Text>
            <Text variant="bodySmall" color="secondary">
              Comienza tu primer workout ahora
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },

  greetingText: {
    color: colors.neutral.textTertiary,
    marginBottom: spacing.xs,
  },

  nameText: {
    color: colors.neutral[900],
  },

  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary[700],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary[700],
  },

  scoreCard: {
    backgroundColor: colors.neutral.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.neutral[900],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  scoreCardLabel: {
    color: colors.neutral.textTertiary,
    marginBottom: spacing.lg,
  },

  scoreCircleContainer: {
    marginVertical: spacing.md,
  },

  scoreDescription: {
    color: colors.neutral.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  statsGrid: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  statCard: {
    marginBottom: spacing.xs,
  },

  ctaContainer: {
    marginVertical: spacing.lg,
  },

  ctaButton: {
    height: 60,
  },

  ctaIcon: {
    fontSize: 22,
  },

  recentSection: {
    marginTop: spacing.xl,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  seeAllText: {
    color: colors.primary[600],
    fontWeight: '600',
  },

  emptyState: {
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
  },

  emptyStateIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },

  emptyStateText: {
    color: colors.neutral[900],
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
});

export default HomeScreen;
