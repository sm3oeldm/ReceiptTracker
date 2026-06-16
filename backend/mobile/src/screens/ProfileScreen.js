import React, { useContext, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Switch, Animated, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

/**
 * Animated button wrapper — scales in/out on press.
 */
function AnimatedBtn({ onPress, disabled, style, children }) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useContext(AuthContext);
  const { isDark, toggleDark, colors } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Read display_name from both possible keys for backward compatibility
  const displayName = user?.display_name || user?.displayName || 'User';
  const email = user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            await logout();
          },
        },
      ]
    );
  };

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Profile</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* User Info */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
          <Text style={s.displayName}>{displayName}</Text>
          <Text style={s.email}>{email}</Text>
        </View>

        {/* Settings Card */}
        <View style={s.settingsCard}>
          <Text style={s.sectionLabel}>APPEARANCE</Text>

          <View style={s.settingRow}>
            <View style={[s.settingIcon, { backgroundColor: isDark ? '#3D2E1B' : '#FFF3E0' }]}>
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={20}
                color={isDark ? '#ffa726' : '#e67e22'}
              />
            </View>
            <View style={s.settingContent}>
              <Text style={s.settingLabel}>Dark Mode</Text>
              <Text style={s.settingDesc}>{isDark ? 'On' : 'Off'}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleDark}
              trackColor={{ false: '#ddd', true: '#66BB6A' }}
              thumbColor={isDark ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Actions Card */}
        <View style={s.actionsCard}>
          <AnimatedBtn onPress={handleLogout} disabled={isLoggingOut}>
            <View style={s.actionRow}>
              <View style={[s.actionIcon, { backgroundColor: colors.dangerLight }]}>
                <Ionicons name="log-out" size={22} color={colors.danger} />
              </View>
              <Text style={[s.actionText, { color: colors.danger }]}>
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </AnimatedBtn>
        </View>

        {/* App Info */}
        <Text style={s.version}>Receipt Tracker v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: c.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: c.text,
  },
  scroll: {
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: c.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 24,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: c.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: c.textInverse,
  },
  displayName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: c.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: c.textSecondary,
  },
  settingsCard: {
    backgroundColor: c.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: c.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
  },
  settingDesc: {
    fontSize: 13,
    color: c.textMuted,
    marginTop: 2,
  },
  actionsCard: {
    backgroundColor: c.cardBg,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  version: {
    fontSize: 13,
    color: c.textMuted,
    textAlign: 'center',
    marginTop: 30,
  },
});
