import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function GroupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Groups</Text>
      <Text style={styles.info}>Manage your shared groups and expenses here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
