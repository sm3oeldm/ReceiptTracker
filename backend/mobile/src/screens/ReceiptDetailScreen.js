import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getReceiptById, updateReceipt } from '../services/api';

/**
 * Calculate days remaining until an expiry date.
 */
function daysUntil(dateString) {
  if (!dateString) return null;
  const target = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

/**
 * Get badge config based on days remaining.
 */
function getBadge(days, type) {
  if (days === null) return null;
  const label = type === 'return' ? 'Return' : 'Warranty';
  if (days < 0) return { label: `${label} Expired`, color: '#e74c3c', bg: '#FDEDED', icon: 'alert-circle' };
  if (days === 0) return { label: `${label} Expires Today`, color: '#e67e22', bg: '#FFF3E0', icon: 'warning' };
  if (days <= 3) return { label: `${label}: ${days} Day${days > 1 ? 's' : ''} Left`, color: '#e67e22', bg: '#FFF3E0', icon: 'warning' };
  if (days <= 7) return { label: `${label}: ${days} Days Left`, color: '#f1c40f', bg: '#FFFDE7', icon: 'time' };
  if (days <= 30) return { label: `${label}: ${days} Days Left`, color: '#4CAF50', bg: '#E8F5E9', icon: 'time' };
  return { label: `${label}: ${days} Days Left`, color: '#999', bg: '#f5f5f5', icon: 'time' };
}

export default function ReceiptDetailScreen({ route, navigation }) {
  const { receiptId } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Receipt fields
  const [receipt, setReceipt] = useState(null);

  // Editable warranty fields
  const [warrantyDuration, setWarrantyDuration] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [returnPeriod, setReturnPeriod] = useState('');
  const [returnExpiry, setReturnExpiry] = useState('');
  const [warrantyNotes, setWarrantyNotes] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  const loadReceipt = useCallback(async () => {
    try {
      setError(null);
      const data = await getReceiptById(receiptId);
      setReceipt(data);
      setWarrantyDuration(data.warranty_duration || '');
      setWarrantyExpiry(data.warranty_expiry_date || '');
      setReturnPeriod(data.return_period || '');
      setReturnExpiry(data.return_expiry_date || '');
      setReturnExpiry(data.return_expiry_date || '');
      setWarrantyNotes(data.warranty_notes || '');
      setHasChanges(false);
    } catch (err) {
      console.error('Load receipt error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [receiptId]);

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReceipt();
  };

  const markChanged = () => setHasChanges(true);

  const handleSaveWarranty = async () => {
    try {
      setSaving(true);
      await updateReceipt(receiptId, {
        warranty_duration: warrantyDuration.trim() || null,
        warranty_expiry_date: warrantyExpiry.trim() || null,
        return_period: returnPeriod.trim() || null,
        return_expiry_date: returnExpiry.trim() || null,
        warranty_notes: warrantyNotes.trim() || null,
      });
      setHasChanges(false);
      Alert.alert('Saved', 'Warranty and return info updated.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={64} color="#e74c3c" />
        <Text style={styles.errorTitle}>Could not load receipt</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={loadReceipt}>
          <Ionicons name="refresh" size={18} color="white" />
          <Text style={styles.primaryButtonText}>  Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!receipt) return null;

  const returnDays = daysUntil(receipt.return_expiry_date);
  const warrantyDays = daysUntil(receipt.warranty_expiry_date);
  const returnBadge = receipt.return_expiry_date ? getBadge(returnDays, 'return') : null;
  const warrantyBadge = receipt.warranty_expiry_date ? getBadge(warrantyDays, 'warranty') : null;
  const currency = receipt.currency || 'AED';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt Details</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />
        }
      >
        {/* Receipt Info Card */}
        <View style={styles.card}>
          <View style={styles.receiptHeader}>
            <View style={styles.merchantRow}>
              <Ionicons name="storefront" size={20} color="#4CAF50" />
              <Text style={styles.merchant}>{receipt.merchant}</Text>
            </View>
            <Text style={styles.total}>{currency} {receipt.total?.toFixed(2)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.infoText}>{receipt.receipt_date}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.categoryLabel}>
              {receipt.categories?.icon || '📦'} {receipt.categories?.name || 'Other'}
            </Text>
          </View>

          {receipt.notes && (
            <View style={styles.notesBox}>
              <Ionicons name="information-circle" size={16} color="#666" />
              <Text style={styles.notesText}>{receipt.notes}</Text>
            </View>
          )}
        </View>

        {/* Items Card */}
        {receipt.items && receipt.items.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              <Ionicons name="list" size={16} color="#333" /> Items
            </Text>
            {receipt.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{currency} {parseFloat(item.price).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Warranty & Return Status */}
        {(returnBadge || warrantyBadge || receipt.warranty_duration || receipt.return_period) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              <Ionicons name="shield-checkmark" size={16} color="#333" /> Warranty & Return Status
            </Text>

            {returnBadge && (
              <View style={[styles.statusBadge, { backgroundColor: returnBadge.bg }]}>
                <Ionicons name={returnBadge.icon} size={18} color={returnBadge.color} />
                <View style={styles.statusContent}>
                  <Text style={[styles.statusLabel, { color: returnBadge.color }]}>{returnBadge.label}</Text>
                  {receipt.return_period && (
                    <Text style={styles.statusDetail}>Return period: {receipt.return_period}</Text>
                  )}
                </View>
              </View>
            )}

            {warrantyBadge && (
              <View style={[styles.statusBadge, { backgroundColor: warrantyBadge.bg, marginTop: 8 }]}>
                <Ionicons name={warrantyBadge.icon} size={18} color={warrantyBadge.color} />
                <View style={styles.statusContent}>
                  <Text style={[styles.statusLabel, { color: warrantyBadge.color }]}>{warrantyBadge.label}</Text>
                  {receipt.warranty_duration && (
                    <Text style={styles.statusDetail}>Warranty: {receipt.warranty_duration}</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Edit Warranty & Return */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            <Ionicons name="create" size={16} color="#333" /> Edit Warranty & Return
          </Text>

          <Text style={styles.inputLabel}>Warranty Duration</Text>
          <TextInput
            style={styles.input}
            value={warrantyDuration}
            onChangeText={v => { setWarrantyDuration(v); markChanged(); }}
            placeholder="e.g. 2 years, 90 days"
          />

          <Text style={styles.inputLabel}>Warranty Expiry Date</Text>
          <TextInput
            style={styles.input}
            value={warrantyExpiry}
            onChangeText={v => { setWarrantyExpiry(v); markChanged(); }}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.inputLabel}>Return Period</Text>
          <TextInput
            style={styles.input}
            value={returnPeriod}
            onChangeText={v => { setReturnPeriod(v); markChanged(); }}
            placeholder="e.g. 14 days, 30 days"
          />

          <Text style={styles.inputLabel}>Return Expiry Date</Text>
          <TextInput
            style={styles.input}
            value={returnExpiry}
            onChangeText={v => { setReturnExpiry(v); markChanged(); }}
            placeholder="YYYY-MM-DD"
          />

          <Text style={styles.inputLabel}>Warranty Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={warrantyNotes}
            onChangeText={v => { setWarrantyNotes(v); markChanged(); }}
            placeholder="Additional warranty details..."
            multiline
          />

          {hasChanges && (
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.savingBtn]}
              onPress={handleSaveWarranty}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="save" size={18} color="white" />
                  <Text style={styles.saveBtnText}>  Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Clear warranty data button */}
          {(warrantyDuration || returnPeriod || warrantyNotes) && !hasChanges && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                Alert.alert(
                  'Clear Warranty Data',
                  'Remove all warranty and return info for this receipt?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Clear',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          setSaving(true);
                          await updateReceipt(receiptId, {
                            warranty_duration: null,
                            warranty_expiry_date: null,
                            return_period: null,
                            return_expiry_date: null,
                            warranty_notes: null,
                          });
                          setWarrantyDuration('');
                          setWarrantyExpiry('');
                          setReturnPeriod('');
                          setReturnExpiry('');
                          setWarrantyNotes('');
                          Alert.alert('Cleared', 'Warranty and return data removed.');
                        } catch (err) {
                          Alert.alert('Error', err.message);
                        } finally {
                          setSaving(false);
                        }
                      },
                    },
                  ]
                );
              }}
              disabled={saving}
            >
              <Ionicons name="trash-outline" size={16} color="#e74c3c" />
              <Text style={styles.clearBtnText}>  Clear Warranty Data</Text>
            </TouchableOpacity>
          )}
        </View>

        {receipt.extracted_by_gemini && (
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={14} color="#888" />
            <Text style={styles.aiBadgeText}>Warranty info extracted by AI</Text>
          </View>
        )}

        {/* Bottom spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  receiptHeader: {
    marginBottom: 12,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  merchant: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  total: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  categoryLabel: {
    fontSize: 14,
    color: '#666',
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  // Items
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginLeft: 10,
  },
  // Status badges
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusDetail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  // Inputs
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  savingBtn: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 12,
  },
  clearBtnText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  aiBadgeText: {
    fontSize: 12,
    color: '#888',
  },
});
