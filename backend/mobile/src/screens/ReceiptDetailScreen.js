import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getReceiptById } from '../services/api';
import { useTheme } from '../context/ThemeContext';

function daysUntil(dateString) {
  if (!dateString) return null;
  const target = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

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
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

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
      <View style={s.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.centerContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.danger} />
        <Text style={s.errorTitle}>Could not load receipt</Text>
        <Text style={s.errorText}>{error}</Text>
        <TouchableOpacity style={s.primaryButton} onPress={loadReceipt}>
          <Ionicons name="refresh" size={18} color="white" />
          <Text style={s.primaryButtonText}>  Try Again</Text>
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
    <View style={s.container}>
      <View style={s.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Receipt Details</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Receipt Info */}
        <View style={s.card}>
          <View style={s.receiptHeader}>
            <View style={s.merchantRow}>
              <Ionicons name="storefront" size={20} color={colors.accent} />
              <Text style={s.merchant}>{receipt.merchant}</Text>
            </View>
            <Text style={s.total}>{currency} {receipt.total?.toFixed(2)}</Text>
          </View>

          <View style={s.infoRow}>
            <Ionicons name="calendar" size={16} color={colors.textSecondary} />
            <Text style={s.infoText}>{receipt.receipt_date}</Text>
          </View>

          <View style={s.infoRow}>
            <Text style={s.categoryLabel}>
              {receipt.categories?.icon || '📦'} {receipt.categories?.name || 'Other'}
            </Text>
          </View>

          {receipt.notes && (
            <View style={s.notesBox}>
              <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
              <Text style={s.notesText}>{receipt.notes}</Text>
            </View>
          )}
        </View>

        {/* Items Card */}
        {receipt.items && receipt.items.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>
              <Ionicons name="list" size={16} color={colors.text} /> Items
            </Text>
            {receipt.items.map((item, idx) => (
              <View key={idx} style={s.itemRow}>
                <Text style={s.itemName}>{item.name}</Text>
                <Text style={s.itemPrice}>{currency} {parseFloat(item.price).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Warranty & Return Status */}
        {hasWarrantyData && (
          <View style={s.card}>
            <Text style={s.cardTitle}>
              <Ionicons name="shield-checkmark" size={16} color={colors.text} /> Warranty & Return
            </Text>

            {receipt.warranty_duration && (
              <View style={s.warrantyRow}>
                <Ionicons name="shield-outline" size={16} color={colors.textSecondary} />
                <Text style={s.warrantyRowText}>Warranty: {receipt.warranty_duration}</Text>
              </View>
            )}

            {receipt.return_period && (
              <View style={s.warrantyRow}>
                <Ionicons name="refresh-outline" size={16} color={colors.textSecondary} />
                <Text style={s.warrantyRowText}>Return: {receipt.return_period}</Text>
              </View>
            )}

            {returnBadge && (
              <View style={[s.statusBadge, { backgroundColor: returnBadge.bg, marginTop: 10 }]}>
                <Ionicons name={returnBadge.icon} size={18} color={returnBadge.color} />
                <View style={s.statusContent}>
                  <Text style={[s.statusLabel, { color: returnBadge.color }]}>{returnBadge.label}</Text>
                  {receipt.return_expiry_date && (
                    <Text style={s.statusDetail}>Return deadline: {receipt.return_expiry_date}</Text>
                  )}
                </View>
              </View>
            )}

            {warrantyBadge && (
              <View style={[s.statusBadge, { backgroundColor: warrantyBadge.bg, marginTop: 10 }]}>
                <Ionicons name={warrantyBadge.icon} size={18} color={warrantyBadge.color} />
                <View style={s.statusContent}>
                  <Text style={[s.statusLabel, { color: warrantyBadge.color }]}>{warrantyBadge.label}</Text>
                  {receipt.warranty_expiry_date && (
                    <Text style={s.statusDetail}>Warranty expires: {receipt.warranty_expiry_date}</Text>
                  )}
                </View>
              </View>
            )}

            {receipt.warranty_notes && (
              <View style={s.notesBox}>
                <Ionicons name="document-text" size={16} color={colors.textSecondary} />
                <Text style={s.notesText}>{receipt.warranty_notes}</Text>
              </View>
            )}
          </View>
        )}

        {receipt.extracted_by_gemini && (
          <View style={s.aiBadge}>
            <Ionicons name="sparkles" size={14} color={colors.textMuted} />
            <Text style={s.aiBadgeText}>Warranty info extracted by AI</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: c.bg,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: c.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
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
    color: c.text,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: c.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
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
    color: c.text,
    flex: 1,
  },
  total: {
    fontSize: 24,
    fontWeight: 'bold',
    color: c.accent,
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
    color: c.textSecondary,
  },
  categoryLabel: {
    fontSize: 14,
    color: c.textSecondary,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  notesText: {
    fontSize: 14,
    color: c.textSecondary,
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
  },
  itemName: {
    fontSize: 14,
    color: c.text,
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textSecondary,
    marginLeft: 10,
  },
  warrantyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  warrantyRowText: {
    fontSize: 14,
    color: c.textSecondary,
  },
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
    color: c.text,
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: c.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: c.accent,
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
    color: c.textMuted,
  },
});
