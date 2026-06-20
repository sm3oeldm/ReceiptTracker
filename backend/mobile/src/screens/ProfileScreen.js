import React, { useContext, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Switch, Animated, ScrollView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS, FONT, SHADOW } from '../constants/design';

function AnimatedBtn({ onPress, disabled, style, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} disabled={disabled} activeOpacity={0.85}>
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

  const displayName = user?.display_name || user?.displayName || 'User';
  const email = user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          await logout();
        },
      },
    ]);
  };

  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Profile</Text>
        <View style={s.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User info */}
        <View style={[s.profileCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={[s.avatar, { backgroundColor: colors.accent }]}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
          <Text style={s.displayName}>{displayName}</Text>
          {email && <Text style={s.email}>{email}</Text>}
        </View>

        {/* Appearance */}
        <View style={[s.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={s.sectionLabel}>APPEARANCE</Text>
          <View style={s.settingRow}>
            <View style={[s.settingIcon, { backgroundColor: isDark ? colors.warningLight : colors.warningLight }]}>
              <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={20} color={isDark ? colors.warning : colors.warning} />
            </View>
            <View style={s.settingContent}>
              <Text style={s.settingLabel}>Dark Mode</Text>
              <Text style={s.settingDesc}>{isDark ? 'On' : 'Off'}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleDark}
              trackColor={{ false: colors.border, true: colors.accentLight }}
              thumbColor={isDark ? colors.accent : colors.textMuted}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={[s.actionsCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <AnimatedBtn onPress={handleLogout} disabled={isLoggingOut}>
            <View style={s.actionRow}>
              <View style={[s.actionIcon, { backgroundColor: colors.dangerLight }]}>
                <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              </View>
              <Text style={[s.actionText, { color: colors.danger }]}>
                {isLoggingOut ? 'Logging out...' : 'Log Out'}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </AnimatedBtn>
        </View>

        <Text style={s.version}>Receipt Tracker v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Platform.OS === 'ios' ? 64 : 48,
      paddingHorizontal: SPACING.xl,
      paddingBottom: SPACING.md,
      backgroundColor: c.headerBg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
    },
    headerBtn: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: FONT.sizes.bodyAlt,
      fontWeight: FONT.weights.semibold,
      color: c.text,
    },
    scrollContent: {
      paddingBottom: SPACING.huge,
    },

    // ── Profile card ──
    profileCard: {
      alignItems: 'center',
      marginHorizontal: SPACING.lg,
      marginTop: SPACING.lg,
      padding: SPACING.xxl,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    avatarText: {
      fontSize: FONT.sizes.hero,
      fontWeight: FONT.weights.bold,
      color: '#FFFFFF',
    },
    displayName: {
      fontSize: FONT.sizes.title,
      fontWeight: FONT.weights.bold,
      color: c.text,
      marginBottom: 2,
    },
    email: {
      fontSize: FONT.sizes.body,
      color: c.textSecondary,
    },

    // ── Section card ──
    sectionCard: {
      marginHorizontal: SPACING.lg,
      marginTop: SPACING.lg,
      padding: SPACING.lg,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
    },
    sectionLabel: {
      fontSize: FONT.sizes.caption,
      fontWeight: FONT.weights.bold,
      color: c.textMuted,
      letterSpacing: 1,
      marginBottom: SPACING.md,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.sm,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: SPACING.md,
    },
    settingContent: {
      flex: 1,
    },
    settingLabel: {
      fontSize: FONT.sizes.bodyAlt,
      fontWeight: FONT.weights.semibold,
      color: c.text,
    },
    settingDesc: {
      fontSize: FONT.sizes.label,
      color: c.textMuted,
      marginTop: 1,
    },

    // ── Actions card ──
    actionsCard: {
      marginHorizontal: SPACING.lg,
      marginTop: SPACING.lg,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      overflow: 'hidden',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.lg,
      paddingHorizontal: SPACING.lg,
      gap: SPACING.md,
    },
    actionIcon: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionText: {
      fontSize: FONT.sizes.bodyAlt,
      fontWeight: FONT.weights.semibold,
      flex: 1,
    },

    // ── Version ──
    version: {
      fontSize: FONT.sizes.label,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: SPACING.xxxl,
    },
  });
