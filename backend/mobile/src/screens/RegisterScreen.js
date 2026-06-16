import React, { useState, useContext, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

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
      <View style={s.innerContainer}>
        <Text style={s.title}>Create Account</Text>
        <Text style={s.subtitle}>Join Receipt Tracker</Text>

        <View style={s.inputContainer}>
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

        <View style={s.inputContainer}>
          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCompleteType="email"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={s.inputContainer}>
          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            placeholder="•••••••• (min 8 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCompleteType="password"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={s.inputContainer}>
          <Text style={s.label}>Confirm Password</Text>
          <TextInput
            style={s.input}
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCompleteType="password"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <TouchableOpacity style={s.button} onPress={handleRegister} disabled={isLoading}>
          <Text style={s.buttonText}>{isLoading ? 'Registering...' : 'Register'}</Text>
        </TouchableOpacity>

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

const makeStyles = (c) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  innerContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: c.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: c.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  errorText: {
    color: c.danger,
    textAlign: 'center',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: c.text,
  },
  input: {
    height: 50,
    borderColor: c.inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: c.inputBg,
    color: c.text,
  },
  button: {
    backgroundColor: c.accent,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: {
    color: c.textSecondary,
    marginRight: 5,
  },
  footerLink: {
    color: c.accent,
    fontWeight: 'bold',
  },
});
