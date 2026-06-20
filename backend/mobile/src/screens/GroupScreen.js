import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
  TextInput, ActivityIndicator, Platform,
} from 'react-native';
import { getCurrentGroup, createGroup, joinGroup, leaveGroup } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, FONT, SHADOW } from '../constants/design';

export default function GroupScreen() {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  const loadGroup = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCurrentGroup();
      setGroup(data.group);
      setMembers(data.members);
      setIsOwner(data.isOwner);
    } catch (err) {
      if (err.message.includes('User is not in a group')) {
        setGroup(null);
        setMembers([]);
      } else {
        console.error('Failed to load group:', err);
        setError(err.message || 'Failed to load group');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    try {
      setIsLoading(true);
      const data = await createGroup(groupName);
      setGroup(data.group);
      setMembers([{ id: 'current-user', display_name: 'You' }]);
      setIsOwner(true);
      setShowCreateForm(false);
      Alert.alert('Success', `Group created! Invite code: ${data.inviteCode}`);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }
    try {
      setIsLoading(true);
      const data = await joinGroup(inviteCode);
      setGroup(data.group);
      setIsOwner(false);
      setShowJoinForm(false);
      Alert.alert('Success', `Joined ${data.group.name}!`);
      await loadGroup();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to join group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoading(true);
            await leaveGroup();
            setGroup(null);
            setMembers([]);
            setIsOwner(false);
            Alert.alert('Success', 'You have left the group');
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to leave group');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  const copyInviteCode = async () => {
    try {
      await Clipboard.setStringAsync(group.invite_code);
      Alert.alert('Copied!', 'Invite code copied to clipboard');
    } catch (err) {
      Alert.alert('Error', 'Failed to copy invite code');
    }
  };

  // ── Loading ──
  if (isLoading && !group) {
    return (
      <View style={s.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={s.loadingText}>Loading group info...</Text>
      </View>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <View style={s.centerContainer}>
        <View style={[s.statusCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={s.statusText}>{error}</Text>
          <TouchableOpacity style={s.primaryButton} onPress={loadGroup}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={s.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── No group ──
  if (!group) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.scrollCenter}>
        <View style={s.emptyWrap}>
          <View style={s.emptyIconWrap}>
            <Ionicons name="people-outline" size={40} color={colors.textMuted} />
          </View>
          <Text style={s.emptyTitle}>Not in a group yet</Text>
          <Text style={s.emptySubtext}>
            Create a group or join an existing one to share expenses with family and friends
          </Text>

          <View style={s.actionCardWrap}>
            <TouchableOpacity
              style={[s.actionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
              onPress={() => { setShowCreateForm(true); setShowJoinForm(false); }}
            >
              <View style={[s.actionCardIcon, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="add-outline" size={24} color={colors.accent} />
              </View>
              <View style={s.actionCardContent}>
                <Text style={s.actionCardTitle}>Create Group</Text>
                <Text style={s.actionCardDesc}>Start a new group and invite others</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.actionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
              onPress={() => { setShowJoinForm(true); setShowCreateForm(false); }}
            >
              <View style={[s.actionCardIcon, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="enter-outline" size={24} color={colors.accent} />
              </View>
              <View style={s.actionCardContent}>
                <Text style={s.actionCardTitle}>Join Group</Text>
                <Text style={s.actionCardDesc}>Enter an invite code</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {showCreateForm && (
            <View style={[s.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={s.formTitle}>Create New Group</Text>
              <TextInput
                style={s.input}
                placeholder="Group name (e.g., Family Expenses)"
                value={groupName}
                onChangeText={setGroupName}
                placeholderTextColor={colors.textMuted}
              />
              <View style={s.formButtons}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setShowCreateForm(false)}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.submitBtn} onPress={handleCreateGroup} disabled={isLoading}>
                  <Text style={s.submitText}>{isLoading ? 'Creating...' : 'Create'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showJoinForm && (
            <View style={[s.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={s.formTitle}>Join Existing Group</Text>
              <TextInput
                style={s.input}
                placeholder="Invite code (e.g., ABC123)"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                placeholderTextColor={colors.textMuted}
              />
              <View style={s.formButtons}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setShowJoinForm(false)}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.submitBtn} onPress={handleJoinGroup} disabled={isLoading}>
                  <Text style={s.submitText}>{isLoading ? 'Joining...' : 'Join'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  // ── Group detail view ──
  return (
    <ScrollView style={s.container} contentContainerStyle={s.scrollContent}>
      {/* Group header */}
      <View style={[s.groupCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <View style={s.groupHeader}>
          <Text style={s.groupName}>{group.name}</Text>
          {isOwner && (
            <View style={[s.ownerTag, { backgroundColor: colors.accentLight }]}>
              <Text style={[s.ownerTagText, { color: colors.accent }]}>Owner</Text>
            </View>
          )}
        </View>
      </View>

      {/* Invite code */}
      <View style={[s.inviteCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <Text style={s.inviteLabel}>Invite Code</Text>
        <View style={s.inviteRow}>
          <Text style={s.inviteCode}>{group.invite_code}</Text>
          <TouchableOpacity style={s.copyBtn} onPress={copyInviteCode} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="copy-outline" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Members */}
      <View style={[s.membersCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <View style={s.sectionHeader}>
          <Ionicons name="people-outline" size={16} color={colors.text} />
          <Text style={s.sectionTitle}>Members</Text>
        </View>
        {members.map((member, index) => (
          <View key={index} style={[s.memberRow, index === members.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={s.memberAvatar}>
              <Ionicons name="person-outline" size={18} color={colors.textMuted} />
            </View>
            <Text style={s.memberName}>{member.display_name}</Text>
            {member.id === 'current-user' && (
              <View style={[s.youTag, { backgroundColor: colors.accentLight }]}>
                <Text style={[s.youTagText, { color: colors.accent }]}>You</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Leave */}
      <View style={s.leaveWrap}>
        <TouchableOpacity style={s.leaveBtn} onPress={handleLeaveGroup} disabled={isLoading}>
          <Ionicons name="exit-outline" size={20} color="#FFFFFF" />
          <Text style={s.leaveBtnText}>{isLoading ? 'Leaving...' : 'Leave Group'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── Styles ──

const makeStyles = (c) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    centerContainer: {
      flex: 1, justifyContent: 'center', alignItems: 'center',
      padding: SPACING.xxxl, backgroundColor: c.bg,
    },
    loadingText: { marginTop: SPACING.md, fontSize: FONT.sizes.body, color: c.textSecondary },
    scrollCenter: { flexGrow: 1, justifyContent: 'center' },
    scrollContent: { paddingBottom: SPACING.huge },

    // ── Status card ──
    statusCard: {
      alignItems: 'center', padding: SPACING.xxxl,
      borderRadius: RADIUS.lg, borderWidth: 1, gap: SPACING.sm,
    },
    statusText: { fontSize: FONT.sizes.body, color: c.textSecondary, textAlign: 'center' },

    // ── No group ──
    emptyWrap: { alignItems: 'center', padding: SPACING.xxxl },
    emptyIconWrap: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: c.borderLight,
      justifyContent: 'center', alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    emptyTitle: {
      fontSize: FONT.sizes.xl, fontWeight: FONT.weights.bold,
      color: c.text, marginBottom: SPACING.xs,
    },
    emptySubtext: {
      fontSize: FONT.sizes.body, color: c.textMuted,
      textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xxl,
    },
    actionCardWrap: { width: '100%', gap: SPACING.md, marginBottom: SPACING.lg },
    actionCard: {
      flexDirection: 'row', alignItems: 'center',
      padding: SPACING.xl, borderRadius: RADIUS.lg, borderWidth: 1, gap: SPACING.md,
    },
    actionCardIcon: {
      width: 44, height: 44, borderRadius: 14,
      justifyContent: 'center', alignItems: 'center',
    },
    actionCardContent: { flex: 1 },
    actionCardTitle: {
      fontSize: FONT.sizes.bodyAlt, fontWeight: FONT.weights.semibold, color: c.text,
    },
    actionCardDesc: { fontSize: FONT.sizes.label, color: c.textMuted, marginTop: 1 },

    // ── Forms ──
    formCard: {
      width: '100%', padding: SPACING.xl,
      borderRadius: RADIUS.lg, borderWidth: 1, marginBottom: SPACING.md,
    },
    formTitle: {
      fontSize: FONT.sizes.heading, fontWeight: FONT.weights.bold,
      color: c.text, marginBottom: SPACING.lg,
    },
    input: {
      height: 50, borderColor: c.inputBorder, borderWidth: 1,
      borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md,
      fontSize: FONT.sizes.bodyAlt, backgroundColor: c.inputBg,
      color: c.text, marginBottom: SPACING.lg,
    },
    formButtons: { flexDirection: 'row', gap: SPACING.md },
    cancelBtn: {
      flex: 1, height: 44, borderRadius: RADIUS.sm,
      borderWidth: 1, borderColor: c.inputBorder,
      justifyContent: 'center', alignItems: 'center',
    },
    cancelText: {
      fontSize: FONT.sizes.body, fontWeight: FONT.weights.semibold, color: c.textSecondary,
    },
    submitBtn: {
      flex: 1, height: 44, borderRadius: RADIUS.sm,
      backgroundColor: c.accent, justifyContent: 'center', alignItems: 'center',
    },
    submitText: { color: '#FFFFFF', fontSize: FONT.sizes.body, fontWeight: FONT.weights.semibold },

    // ── Group detail ──
    groupCard: {
      margin: SPACING.xl, marginBottom: 0,
      padding: SPACING.xl, borderRadius: RADIUS.lg, borderWidth: 1,
    },
    groupHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    groupName: { fontSize: FONT.sizes.title, fontWeight: FONT.weights.bold, color: c.text },
    ownerTag: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm },
    ownerTagText: { fontSize: FONT.sizes.caption, fontWeight: FONT.weights.semibold },

    // ── Invite code ──
    inviteCard: {
      margin: SPACING.xl, marginBottom: 0,
      padding: SPACING.xl, borderRadius: RADIUS.lg, borderWidth: 1,
    },
    inviteLabel: { fontSize: FONT.sizes.body, color: c.textSecondary, marginBottom: SPACING.sm },
    inviteRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    inviteCode: {
      fontSize: FONT.sizes.largeTitle, fontWeight: FONT.weights.bold,
      color: c.text, letterSpacing: 2,
    },
    copyBtn: { padding: SPACING.xs },

    // ── Members ──
    membersCard: {
      margin: SPACING.xl, marginBottom: 0,
      padding: SPACING.xl, borderRadius: RADIUS.lg, borderWidth: 1,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.md },
    sectionTitle: { fontSize: FONT.sizes.bodyAlt, fontWeight: FONT.weights.semibold, color: c.text },
    memberRow: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
      paddingVertical: SPACING.md,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.divider,
    },
    memberAvatar: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: c.borderLight,
      justifyContent: 'center', alignItems: 'center',
    },
    memberName: { flex: 1, fontSize: FONT.sizes.body, color: c.text, fontWeight: FONT.weights.medium },
    youTag: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm },
    youTagText: { fontSize: FONT.sizes.caption, fontWeight: FONT.weights.semibold },

    // ── Leave ──
    leaveWrap: { padding: SPACING.xl },
    leaveBtn: {
      flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
      height: 48, borderRadius: RADIUS.md,
      backgroundColor: c.danger,
    },
    leaveBtnText: { color: '#FFFFFF', fontSize: FONT.sizes.bodyAlt, fontWeight: FONT.weights.semibold },

    // ── Shared ──
    primaryButton: {
      flexDirection: 'row', backgroundColor: c.accent,
      paddingVertical: SPACING.md, paddingHorizontal: SPACING.xxl,
      borderRadius: RADIUS.md, alignItems: 'center', gap: 8,
      marginTop: SPACING.sm,
    },
    primaryButtonText: { color: '#FFFFFF', fontSize: FONT.sizes.bodyAlt, fontWeight: FONT.weights.semibold },
  });
