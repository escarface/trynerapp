import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Animated, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Screen from '@/shared/components/Screen';
import Text from '@/shared/components/Text';
import Button from '@/shared/components/Button';
import { Input, PasswordInput } from '@/shared/components/Input';
import { colors, spacing, borderRadius } from '@/core/theme';
import { createUser, emailExists } from '@/core/database';
import { useAuthStore } from '../store/authStore';

export const RegisterScreen = () => {
  const navigation = useNavigation();
  const { login, setLoading } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

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

  const validateForm = (): boolean => {
    // Reset errors
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    let isValid = true;

    if (!name.trim()) {
      setNameError('El nombre es requerido');
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError('El correo es requerido');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Correo inválido');
      isValid = false;
    }

    if (!password) {
      setPasswordError('La contraseña es requerida');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Mínimo 8 caracteres');
      isValid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Las contraseñas no coinciden');
      isValid = false;
    }

    if (!acceptedTerms) {
      Alert.alert('Términos y Condiciones', 'Debes aceptar los términos para continuar');
      isValid = false;
    }

    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Check if email already exists
      const exists = await emailExists(email);
      if (exists) {
        setEmailError('Este correo ya está registrado');
        return;
      }

      // Create user
      const user = await createUser({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      // Auto-login after registration
      login(user);

      Alert.alert(
        '¡Cuenta creada!',
        'Tu cuenta ha sido creada exitosamente',
        [
          {
            text: 'Continuar',
            onPress: () => {
              // Navigate to onboarding or main app
              // TODO: Implement onboarding flow
            },
          },
        ]
      );
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', 'Ocurrió un error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll keyboardAvoiding safeAreaEdges={['top', 'bottom']}>
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

        {/* Back Button */}
        <Animated.View
          style={[
            styles.backButtonContainer,
            { opacity: fadeAnim },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text variant="h3" style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </Animated.View>

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
            <Text style={styles.heroIcon}>🚀</Text>
          </View>
          <Text variant="display" style={styles.heroTitle}>
            Comienza ahora
          </Text>
          <Text variant="bodyLarge" style={styles.heroSubtitle}>
            Tu viaje fitness empieza aquí
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
            label="NOMBRE COMPLETO"
            placeholder="Tu nombre"
            value={name}
            onChangeText={setName}
            error={nameError}
            autoCapitalize="words"
          />

          <Input
            label="CORREO ELECTRÓNICO"
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            containerStyle={styles.inputSpacing}
            error={emailError}
          />

          <PasswordInput
            label="CONTRASEÑA"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChangeText={setPassword}
            containerStyle={styles.inputSpacing}
            error={passwordError}
          />

          <PasswordInput
            label="CONFIRMAR CONTRASEÑA"
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            containerStyle={styles.inputSpacing}
            error={confirmPasswordError}
          />

          {/* Terms & Conditions */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.checkbox,
                acceptedTerms && styles.checkboxChecked,
              ]}
            >
              {acceptedTerms && (
                <Animated.Text style={styles.checkmark}>✓</Animated.Text>
              )}
            </Animated.View>
            <Text variant="bodySmall" style={styles.termsText}>
              Acepto los{' '}
              <Text style={styles.link}>Términos de Servicio</Text> y la{' '}
              <Text style={styles.link}>Política de Privacidad</Text>
            </Text>
          </TouchableOpacity>

          <Button
            title="Crear cuenta"
            variant="primary"
            fullWidth
            onPress={handleRegister}
            disabled={!acceptedTerms}
            style={styles.registerButton}
          />
        </Animated.View>

        {/* Login Link */}
        <Animated.View
          style={[
            styles.loginContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text variant="body" style={styles.loginText}>
            ¿Ya tienes cuenta?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text variant="bodyBold" style={styles.loginLink}>
              Inicia sesión
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
    paddingTop: spacing.md,
  },

  backgroundAccent: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    height: 400,
    backgroundColor: colors.success[500],
    borderRadius: 400,
  },

  backButtonContainer: {
    marginBottom: spacing.lg,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.neutral[900],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  backIcon: {
    color: colors.neutral[900],
  },

  heroContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },

  heroIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.success[700],
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
    fontSize: 48,
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

  inputSpacing: {
    marginTop: spacing.lg,
  },

  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.surface,
  },

  checkboxChecked: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },

  checkmark: {
    color: colors.neutral.white,
    fontSize: 14,
    fontWeight: 'bold',
  },

  termsText: {
    flex: 1,
    color: colors.neutral.textSecondary,
    lineHeight: 20,
  },

  link: {
    color: colors.primary[600],
    fontWeight: '600',
  },

  registerButton: {
    marginTop: spacing.md,
  },

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  loginText: {
    color: colors.neutral.textSecondary,
  },

  loginLink: {
    color: colors.primary[600],
  },
});

export default RegisterScreen;
