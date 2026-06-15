import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { getCurrentGroup, createGroup, joinGroup, leaveGroup } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

export default function GroupScreen() {
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading group information...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="red" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadGroup}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {!group ? (
        <View style={styles.noGroupContainer}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.noGroupText}>You're not in a group yet</Text>
          <Text style={styles.noGroupSubtext}>Create a group or join an existing one to share expenses with family</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.createButton]}
              onPress={() => {
                setShowCreateForm(true);
                setShowJoinForm(false);
              }}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.buttonText}>Create Group</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.joinButton]}
              onPress={() => {
                setShowJoinForm(true);
                setShowCreateForm(false);
              }}
            >
              <Ionicons name="enter" size={20} color="white" />
              <Text style={styles.buttonText}>Join Group</Text>
            </TouchableOpacity>
          </View>

          {showCreateForm && (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Create New Group</Text>
              <TextInput
                style={styles.input}
                placeholder="Group Name (e.g., Family Expenses)"
                value={groupName}
                onChangeText={setGroupName}
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => setShowCreateForm(false)}
                >
                  <Text style={styles.formButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.submitButton]}
                  onPress={handleCreateGroup}
                  disabled={isLoading}
                >
                  <Text style={styles.formButtonText}>{isLoading ? 'Creating...' : 'Create'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showJoinForm && (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Join Existing Group</Text>
              <TextInput
                style={styles.input}
                placeholder="Invite Code (e.g., ABC123)"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => setShowJoinForm(false)}
                >
                  <Text style={styles.formButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.submitButton]}
                  onPress={handleJoinGroup}
                  disabled={isLoading}
                >
                  <Text style={styles.formButtonText}>{isLoading ? 'Joining...' : 'Join'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.groupContainer}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupName}>{group.name}</Text>
            {isOwner && <Text style={styles.ownerBadge}>Owner</Text>}
          </View>

          <View style={styles.inviteCodeContainer}>
            <Text style={styles.inviteCodeLabel}>Invite Code</Text>
            <View style={styles.inviteCodeDisplay}>
              <Text style={styles.inviteCodeText}>{group.invite_code}</Text>
              <TouchableOpacity onPress={copyInviteCode} style={styles.copyButton}>
                <Ionicons name="copy" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Group Members</Text>
            {members.map((member, index) => (
              <View key={index} style={styles.memberItem}>
                <Text style={styles.memberName}>{member.display_name}</Text>
                {member.id === 'current-user' && (
                  <Text style={styles.youBadge}>You</Text>
                )}
              </View>
            ))}
          </View>

          <View style={styles.leaveButtonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.leaveButton]}
              onPress={handleLeaveGroup}
              disabled={isLoading}
            >
              <Ionicons name="exit" size={20} color="white" />
              <Text style={styles.buttonText}>{isLoading ? 'Leaving...' : 'Leave Group'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    margin: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4CAF50',
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
    color: '#666',
    marginTop: 20,
    fontWeight: '600',
  },
  noGroupSubtext: {
    fontSize: 16,
    color: '#999',
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
    backgroundColor: '#4CAF50',
  },
  joinButton: {
    backgroundColor: '#2196F3',
  },
  leaveButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fff',
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
    backgroundColor: '#ccc',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
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
    color: '#333',
  },
  ownerBadge: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: 5,
    borderRadius: 10,
    fontSize: 12,
    marginLeft: 10,
    overflow: 'hidden',
  },
  inviteCodeContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inviteCodeLabel: {
    fontSize: 16,
    color: '#666',
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
    color: '#333',
    letterSpacing: 2,
  },
  copyButton: {
    padding: 10,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberName: {
    fontSize: 16,
    color: '#333',
  },
  youBadge: {
    backgroundColor: '#2196F3',
    color: 'white',
    padding: 3,
    borderRadius: 8,
    fontSize: 12,
    overflow: 'hidden',
  },
  leaveButtonContainer: {
    marginTop: 20,
  },
});
