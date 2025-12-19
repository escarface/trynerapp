import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Animated, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Screen from '@/shared/components/Screen';
import Text from '@/shared/components/Text';
import Button from '@/shared/components/Button';
import { Input, PasswordInput } from '@/shared/components/Input';
import { colors, spacing, borderRadius } from '@/core/theme';
import { loginUser } from '@/core/database';
import { useAuthStore } from '../store/authStore';

export const LoginScreen = () => {
  const navigation = useNavigation();
  const { login, setLoading, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
        bounciness: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    // Reset errors
    setEmailError('');
    setPasswordError('');

    // Validate
    if (!email) {
      setEmailError('El correo es requerido');
      return;
    }
    if (!password) {
      setPasswordError('La contraseña es requerida');
      return;
    }

    try {
      setLoading(true);
      const user = await loginUser(email, password);

      if (user) {
        // Login successful
        login(user);
        Alert.alert('¡Bienvenido!', `Hola ${user.name}`);
      } else {
        // Invalid credentials
        Alert.alert('Error', 'Correo o contraseña incorrectos');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Ocurrió un error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert('Próximamente', 'Google Sign In estará disponible en la versión 2.0');
  };

  const handleAppleLogin = () => {
    Alert.alert('Próximamente', 'Apple Sign In estará disponible en la versión 2.0');
  };

  return (
    <Screen scroll keyboardAvoiding safeAreaEdges={['bottom']}>
      <View style={styles.container}>
        {/* Animated Background Accent */}
        <Animated.View
          style={[
            styles.backgroundAccent,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.08],
              }),
            },
          ]}
        />

        {/* Hero Section */}
        <Animated.View
          style={[
            styles.heroContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.heroIconContainer}>
            <Text style={styles.heroIcon}>💪</Text>
          </View>
          <Text variant="display" style={styles.heroTitle}>
            Bienvenido
          </Text>
          <Text variant="bodyLarge" style={styles.heroSubtitle}>
            Transforma tu entrenamiento
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View
          style={[
            styles.form,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 30],
                  }),
                },
              ],
            },
          ]}
        >
          <Input
            label="CORREO ELECTRÓNICO"
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            error={emailError}
          />

          <PasswordInput
            label="CONTRASEÑA"
            placeholder="Tu contraseña"
            value={password}
            onChangeText={setPassword}
            containerStyle={styles.passwordInput}
            error={passwordError}
          />

          <TouchableOpacity style={styles.forgotPassword}>
            <Text variant="bodySmall" style={styles.forgotPasswordText}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <Button
            title="Iniciar Sesión"
            variant="primary"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
            onPress={handleLogin}
            style={styles.loginButton}
          />
        </Animated.View>

        {/* Divider */}
        <Animated.View
          style={[
            styles.dividerContainer,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.4],
              }),
            },
          ]}
        >
          <View style={styles.dividerLine} />
          <Text variant="caption" style={styles.dividerText}>
            O CONTINÚA CON
          </Text>
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* Social Login Buttons */}
        <Animated.View
          style={[
            styles.socialButtons,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 20],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogleLogin}
            activeOpacity={0.7}
          >
            <Text style={styles.socialIcon}>G</Text>
            <Text variant="bodyBold">Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleAppleLogin}
            activeOpacity={0.7}
          >
            <Text style={styles.socialIcon}>A</Text>
            <Text variant="bodyBold">Apple</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Register Link */}
        <Animated.View
          style={[
            styles.registerContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text variant="body" style={styles.registerText}>
            ¿No tienes cuenta?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register' as never)}
            activeOpacity={0.7}
          >
            <Text variant="bodyBold" style={styles.registerLink}>
              Regístrate gratis
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },

  backgroundAccent: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    height: 400,
    backgroundColor: colors.primary[500],
    borderRadius: 400,
  },

  heroContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl * 1.5,
  },

  heroIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary[700],
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  heroIcon: {
    fontSize: 24,
  },

  heroTitle: {
    color: colors.neutral[900],
    marginBottom: spacing.xs,
    textAlign: 'center',
  },

  heroSubtitle: {
    color: colors.neutral.textSecondary,
    textAlign: 'center',
  },

  form: {
    marginBottom: spacing.xl,
  },

  passwordInput: {
    marginTop: spacing.lg,
  },

  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    paddingVertical: spacing.xs,
  },

  forgotPasswordText: {
    color: colors.primary[600],
    fontWeight: '600',
  },

  loginButton: {
    marginTop: spacing.sm,
  },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[300],
  },

  dividerText: {
    marginHorizontal: spacing.lg,
    color: colors.neutral.textTertiary,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  socialButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },

  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    backgroundColor: colors.neutral.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    gap: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: colors.neutral[900],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  socialIcon: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.neutral[800],
  },

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },

  registerText: {
    color: colors.neutral.textSecondary,
  },

  registerLink: {
    color: colors.primary[600],
  },
});

export default LoginScreen;
