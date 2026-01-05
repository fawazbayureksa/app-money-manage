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

export default function LoginScreen() {
  const theme = useTheme();
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: '', password: '' };

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

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Trim inputs to remove accidental spaces
      await login(email.trim(), password.trim());
      // Navigation will be handled by AuthContext and root layout
    } catch (error) {
      // Error is already handled in AuthContext with Alert
      console.error('Login failed:', error);
    }
  };

  const navigateToRegister = () => {
    router.push('/register');
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
            icon="wallet"
            size={48}
            iconColor="#FFF"
          />
        </View>
        <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>
          Welcome Back!
        </Text>
        <Text variant="titleMedium" style={styles.subtitle}>
          Sign in to manage your finances
        </Text>
      </View>

      {/* Login Card */}
      <Surface style={styles.formCard} elevation={2}>
        <View style={styles.form}>
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
            textContentType="password"
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

          <Button
            mode="contained"
            onPress={handleLogin}
            disabled={isLoading}
            style={styles.loginButton}
            contentStyle={styles.buttonContent}
            buttonColor={theme.colors.primary}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text variant="titleMedium" style={{ color: '#FFF', fontWeight: 'bold' }}>
                Sign In
              </Text>
            )}
          </Button>
        </View>
      </Surface>

      {/* Footer */}
      <View style={styles.footer}>
        <Text variant="bodyLarge" style={styles.footerText}>
          Don not have an account?
        </Text>
        <Button
          mode="text"
          onPress={navigateToRegister}
          disabled={isLoading}
          textColor={theme.colors.primary}
          labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
        >
          Sign Up
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
  loginButton: {
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
  apiInfo: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  apiText: {
    fontSize: 11,
    opacity: 0.6,
    textAlign: 'center',
  },
});
