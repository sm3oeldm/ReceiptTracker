import React, { useState, useContext, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, FONT } from '../constants/design';

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const handleRegister = async () => {
    if (!email || !password || !displayName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password should be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      const result = await register(email, password, displayName);
      if (!result.success) {
        Alert.alert('Registration Failed', result.error || 'Registration failed');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Registration failed');
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
          <Text style={s.title}>Create Account</Text>
          <Text style={s.subtitle}>Join Receipt Tracker</Text>
        </View>

        <View style={[s.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={s.field}>
            <Text style={s.label}>Display Name</Text>
            <TextInput
              style={s.input}
              placeholder="Your Name"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              placeholderTextColor={colors.textMuted}
            />
          </View>

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
              placeholder="Min 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Confirm Password</Text>
            <TextInput
              style={s.input}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <TouchableOpacity style={s.button} onPress={handleRegister} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={s.buttonText}>Register</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.footerLink}>Sign In</Text>
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
