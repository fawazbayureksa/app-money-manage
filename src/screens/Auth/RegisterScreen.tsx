import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  HelperText,
  IconButton,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
  const theme = useTheme();
  const { register, isLoading } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    if (!username) {
      newErrors.username = 'Username is required';
      isValid = false;
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
      isValid = false;
    }

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }
    console.log('Registering with:', { username, email, password });
    try {
      // Trim all inputs to remove accidental spaces
      await register(username.trim(), email.trim(), password.trim());
      // Navigation will be handled by AuthContext and root layout
    } catch (error) {
      // Error is already handled in AuthContext with Alert
      console.error('Registration failed:', error);
    }
  };

  const navigateToLogin = () => {
    router.push('/login');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Modern Header with Icon */}
      <View style={styles.heroSection}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary }]}>
          <IconButton
            icon="account-plus"
            size={48}
            iconColor="#FFF"
          />
        </View>
        <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>
          Create Account
        </Text>
        <Text variant="titleMedium" style={styles.subtitle}>
          Start managing your finances today
        </Text>
      </View>

      {/* Register Card */}
      <Surface style={styles.formCard} elevation={2}>
        <View style={styles.form}>
          <TextInput
            label="Username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setErrors({ ...errors, username: '' });
            }}
            mode="outlined"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            disabled={isLoading}
            error={!!errors.username}
            left={<TextInput.Icon icon="account-outline" />}
            style={styles.input}
            outlineStyle={{ borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }}
          />
          <HelperText type="error" visible={!!errors.username}>
            {errors.username}
          </HelperText>

          <TextInput
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors({ ...errors, email: '' });
            }}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            disabled={isLoading}
            error={!!errors.email}
            left={<TextInput.Icon icon="email-outline" />}
            style={styles.input}
            outlineStyle={{ borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }}
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}
          </HelperText>

          <TextInput
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors({ ...errors, password: '' });
            }}
            mode="outlined"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="newPassword"
            disabled={isLoading}
            error={!!errors.password}
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
            outlineStyle={{ borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }}
          />
          <HelperText type="error" visible={!!errors.password}>
            {errors.password}
          </HelperText>

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setErrors({ ...errors, confirmPassword: '' });
            }}
            mode="outlined"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            disabled={isLoading}
            error={!!errors.confirmPassword}
            left={<TextInput.Icon icon="lock-check-outline" />}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
            style={styles.input}
            outlineStyle={{ borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }}
          />
          <HelperText type="error" visible={!!errors.confirmPassword}>
            {errors.confirmPassword}
          </HelperText>

          <Button
            mode="contained"
            onPress={handleRegister}
            disabled={isLoading}
            style={styles.registerButton}
            contentStyle={styles.buttonContent}
            buttonColor={theme.colors.primary}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text variant="titleMedium" style={{ color: '#FFF', fontWeight: 'bold' }}>
                Sign Up
              </Text>
            )}
          </Button>
        </View>
      </Surface>

      {/* Footer */}
      <View style={styles.footer}>
        <Text variant="bodyLarge" style={styles.footerText}>
          Already have an account?
        </Text>
        <Button
          mode="text"
          onPress={navigateToLogin}
          disabled={isLoading}
          textColor={theme.colors.primary}
          labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
        >
          Sign In
        </Button>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#6200EA',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    opacity: 0.7,
    textAlign: 'center',
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  registerButton: {
    marginTop: 24,
    borderRadius: 12,
    elevation: 4,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    opacity: 0.7,
  },
});
