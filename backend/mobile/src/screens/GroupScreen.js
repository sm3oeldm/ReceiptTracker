import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { getCurrentGroup, createGroup, joinGroup, leaveGroup } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../context/ThemeContext';

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

  const loadGroup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCurrentGroup();
      setGroup(data.group);
      setMembers(data.members);
      setIsOwner(data.isOwner);
    } catch (err) {
      if (err.message.includes('User is not in a group')) {
        // User not in a group - this is expected
        setGroup(null);
        setMembers([]);
      } else {
        console.error('Failed to load group:', err);
        setError(err.message || 'Failed to load group');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGroup();
  }, []);

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
      console.error('Failed to create group:', err);
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
      await loadGroup(); // Refresh to get members
    } catch (err) {
      console.error('Failed to join group:', err);
      Alert.alert('Error', err.message || 'Failed to join group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
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
              console.error('Failed to leave group:', err);
              Alert.alert('Error', err.message || 'Failed to leave group');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const copyInviteCode = async () => {
    try {
      await Clipboard.setStringAsync(group.invite_code);
      Alert.alert('Success', 'Invite code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy invite code:', err);
      Alert.alert('Error', 'Failed to copy invite code');
    }
  };

  if (isLoading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={s.loadingText}>Loading group information...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.danger} />
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.retryButton} onPress={loadGroup}>
          <Text style={s.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={s.container}>
      {!group ? (
        <View style={s.noGroupContainer}>
          <Ionicons name="people-outline" size={64} color={colors.textMuted} />
          <Text style={s.noGroupText}>You're not in a group yet</Text>
          <Text style={s.noGroupSubtext}>Create a group or join an existing one to share expenses with family</Text>

          <View style={s.buttonContainer}>
            <TouchableOpacity
              style={[s.button, s.createButton]}
              onPress={() => {
                setShowCreateForm(true);
                setShowJoinForm(false);
              }}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={s.buttonText}>Create Group</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.button, s.joinButton]}
              onPress={() => {
                setShowJoinForm(true);
                setShowCreateForm(false);
              }}
            >
              <Ionicons name="enter" size={20} color="white" />
              <Text style={s.buttonText}>Join Group</Text>
            </TouchableOpacity>
          </View>

          {showCreateForm && (
            <View style={s.formContainer}>
              <Text style={s.formTitle}>Create New Group</Text>
              <TextInput
                style={s.input}
                placeholder="Group Name (e.g., Family Expenses)"
                value={groupName}
                onChangeText={setGroupName}
                placeholderTextColor={colors.textMuted}
              />
              <View style={s.formButtons}>
                <TouchableOpacity
                  style={[s.formButton, s.cancelButton]}
                  onPress={() => setShowCreateForm(false)}
                >
                  <Text style={s.formButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.formButton, s.submitButton]}
                  onPress={handleCreateGroup}
                  disabled={isLoading}
                >
                  <Text style={s.formButtonText}>{isLoading ? 'Creating...' : 'Create'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showJoinForm && (
            <View style={s.formContainer}>
              <Text style={s.formTitle}>Join Existing Group</Text>
              <TextInput
                style={s.input}
                placeholder="Invite Code (e.g., ABC123)"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                placeholderTextColor={colors.textMuted}
              />
              <View style={s.formButtons}>
                <TouchableOpacity
                  style={[s.formButton, s.cancelButton]}
                  onPress={() => setShowJoinForm(false)}
                >
                  <Text style={s.formButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.formButton, s.submitButton]}
                  onPress={handleJoinGroup}
                  disabled={isLoading}
                >
                  <Text style={s.formButtonText}>{isLoading ? 'Joining...' : 'Join'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={s.groupContainer}>
          <View style={s.groupHeader}>
            <Text style={s.groupName}>{group.name}</Text>
            {isOwner && <View style={s.ownerBadge}><Text style={s.ownerBadgeText}>Owner</Text></View>}
          </View>

          <View style={s.inviteCodeContainer}>
            <Text style={s.inviteCodeLabel}>Invite Code</Text>
            <View style={s.inviteCodeDisplay}>
              <Text style={s.inviteCodeText}>{group.invite_code}</Text>
              <TouchableOpacity onPress={copyInviteCode} style={s.copyButton}>
                <Ionicons name="copy" size={20} color={colors.accent} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Group Members</Text>
            {members.map((member, index) => (
              <View key={index} style={s.memberItem}>
                <Text style={s.memberName}>{member.display_name}</Text>
                {member.id === 'current-user' && (
                  <View style={s.youBadge}><Text style={s.youBadgeText}>You</Text></View>
                )}
              </View>
            ))}
          </View>

          <View style={s.leaveButtonContainer}>
            <TouchableOpacity
              style={[s.button, s.leaveButton]}
              onPress={handleLeaveGroup}
              disabled={isLoading}
            >
              <Ionicons name="exit" size={20} color="white" />
              <Text style={s.buttonText}>{isLoading ? 'Leaving...' : 'Leave Group'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: c.bg,
  },
  loadingText: {
    marginTop: 15,
    color: c.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: c.bg,
  },
  errorText: {
    color: c.danger,
    fontSize: 16,
    margin: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: c.accent,
    padding: 12,
    borderRadius: 8,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noGroupContainer: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noGroupText: {
    fontSize: 20,
    color: c.textSecondary,
    marginTop: 20,
    fontWeight: '600',
  },
  noGroupSubtext: {
    fontSize: 16,
    color: c.textMuted,
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  createButton: {
    backgroundColor: c.accent,
  },
  joinButton: {
    backgroundColor: '#2196F3',
  },
  leaveButton: {
    backgroundColor: c.danger,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  formContainer: {
    width: '100%',
    backgroundColor: c.cardBg,
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: c.text,
  },
  input: {
    height: 50,
    borderColor: c.inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: c.inputBg,
    color: c.text,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: c.border,
  },
  submitButton: {
    backgroundColor: c.accent,
  },
  formButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  groupContainer: {
    padding: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: c.text,
  },
  ownerBadge: {
    backgroundColor: c.accent,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10,
  },
  ownerBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  inviteCodeContainer: {
    backgroundColor: c.cardBg,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inviteCodeLabel: {
    fontSize: 16,
    color: c.textSecondary,
    marginBottom: 10,
  },
  inviteCodeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inviteCodeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: c.text,
    letterSpacing: 2,
  },
  copyButton: {
    padding: 10,
  },
  section: {
    backgroundColor: c.cardBg,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: c.text,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.borderLight,
  },
  memberName: {
    fontSize: 16,
    color: c.text,
  },
  youBadge: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  youBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  leaveButtonContainer: {
    marginTop: 20,
  },
});
