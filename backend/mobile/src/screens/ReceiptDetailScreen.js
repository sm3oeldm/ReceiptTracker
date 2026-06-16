import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getReceiptById } from '../services/api';

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
  const [receipt, setReceipt] = useState(null);

  const loadReceipt = useCallback(async () => {
    try {
      setError(null);
      const data = await getReceiptById(receiptId);
      setReceipt(data);
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
  const hasWarrantyData = receipt.warranty_duration || receipt.warranty_expiry_date || receipt.return_period || receipt.return_expiry_date || receipt.warranty_notes;

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
        {hasWarrantyData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              <Ionicons name="shield-checkmark" size={16} color="#333" /> Warranty & Return
            </Text>

            {receipt.warranty_duration && (
              <View style={styles.warrantyRow}>
                <Ionicons name="shield-outline" size={16} color="#666" />
                <Text style={styles.warrantyRowText}>Warranty: {receipt.warranty_duration}</Text>
              </View>
            )}

            {receipt.return_period && (
              <View style={styles.warrantyRow}>
                <Ionicons name="refresh-outline" size={16} color="#666" />
                <Text style={styles.warrantyRowText}>Return: {receipt.return_period}</Text>
              </View>
            )}

            {returnBadge && (
              <View style={[styles.statusBadge, { backgroundColor: returnBadge.bg, marginTop: returnBadge ? 10 : 0 }]}>
                <Ionicons name={returnBadge.icon} size={18} color={returnBadge.color} />
                <View style={styles.statusContent}>
                  <Text style={[styles.statusLabel, { color: returnBadge.color }]}>{returnBadge.label}</Text>
                  {receipt.return_expiry_date && (
                    <Text style={styles.statusDetail}>Return deadline: {receipt.return_expiry_date}</Text>
                  )}
                </View>
              </View>
            )}

            {warrantyBadge && (
              <View style={[styles.statusBadge, { backgroundColor: warrantyBadge.bg, marginTop: 10 }]}>
                <Ionicons name={warrantyBadge.icon} size={18} color={warrantyBadge.color} />
                <View style={styles.statusContent}>
                  <Text style={[styles.statusLabel, { color: warrantyBadge.color }]}>{warrantyBadge.label}</Text>
                  {receipt.warranty_expiry_date && (
                    <Text style={styles.statusDetail}>Warranty expires: {receipt.warranty_expiry_date}</Text>
                  )}
                </View>
              </View>
            )}

            {receipt.warranty_notes && (
              <View style={styles.notesBox}>
                <Ionicons name="document-text" size={16} color="#666" />
                <Text style={styles.notesText}>{receipt.warranty_notes}</Text>
              </View>
            )}
          </View>
        )}

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
  // Warranty rows
  warrantyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  warrantyRowText: {
    fontSize: 14,
    color: '#555',
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
