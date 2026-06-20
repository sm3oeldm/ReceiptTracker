import React, { useState, useContext, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, FONT } from '../constants/design';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useContext(AuthContext);
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    try {
      const result = await signIn(email, password);
      if (!result.success) {
        Alert.alert('Login Failed', result.error || 'Invalid credentials');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.container}
    >
      <View style={s.inner}>
        <View style={s.brandArea}>
          <View style={s.logoWrap}>
            <Text style={s.logoText}>R</Text>
          </View>
          <Text style={s.title}>Welcome Back</Text>
          <Text style={s.subtitle}>Sign in to your account</Text>
        </View>

        <View style={[s.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={s.field}>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <TouchableOpacity style={s.button} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={s.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={s.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    inner: {
      flex: 1,
      padding: SPACING.xl,
      justifyContent: 'center',
    },
    brandArea: {
      alignItems: 'center',
      marginBottom: SPACING.xxxl,
    },
    logoWrap: {
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: c.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    logoText: {
      fontSize: 28,
      fontWeight: FONT.weights.bold,
      color: '#FFFFFF',
    },
    title: {
      fontSize: FONT.sizes.largeTitle,
      fontWeight: FONT.weights.bold,
      color: c.text,
      marginBottom: SPACING.xs,
    },
    subtitle: {
      fontSize: FONT.sizes.body,
      color: c.textSecondary,
    },
    formCard: {
      padding: SPACING.xl,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
    },
    field: {
      marginBottom: SPACING.lg,
    },
    label: {
      fontSize: FONT.sizes.label,
      fontWeight: FONT.weights.semibold,
      color: c.textSecondary,
      marginBottom: 6,
    },
    input: {
      height: 50,
      borderColor: c.inputBorder,
      borderWidth: 1,
      borderRadius: RADIUS.sm,
      paddingHorizontal: SPACING.md,
      fontSize: FONT.sizes.bodyAlt,
      backgroundColor: c.inputBg,
      color: c.text,
    },
    button: {
      backgroundColor: c.accent,
      height: 50,
      borderRadius: RADIUS.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.sm,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: FONT.sizes.bodyAlt,
      fontWeight: FONT.weights.semibold,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: SPACING.xxl,
      gap: 4,
    },
    footerText: {
      color: c.textSecondary,
      fontSize: FONT.sizes.body,
    },
    footerLink: {
      color: c.accent,
      fontWeight: FONT.weights.bold,
      fontSize: FONT.sizes.body,
    },
  });
