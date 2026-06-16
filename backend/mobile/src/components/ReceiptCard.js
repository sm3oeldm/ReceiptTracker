import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Calculate days remaining until a target date.
 * Returns a positive number for future dates, negative for past, null if invalid.
 */
function daysUntil(dateString) {
  if (!dateString) return null;
  const target = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
}

/**
 * Get badge config for an expiry date.
 */
function getBadge(days) {
  if (days === null) return null;
  if (days < 0) return { label: 'Expired', color: '#e74c3c', bg: '#FDEDED', icon: 'alert-circle' };
  if (days === 0) return { label: 'Expires Today', color: '#e67e22', bg: '#FFF3E0', icon: 'warning' };
  if (days <= 3) return { label: `${days} Day${days > 1 ? 's' : ''} Left`, color: '#e67e22', bg: '#FFF3E0', icon: 'warning' };
  if (days <= 7) return { label: `${days} Days Left`, color: '#f1c40f', bg: '#FFFDE7', icon: 'time' };
  if (days <= 14) return { label: `${days} Days Left`, color: '#8bc34a', bg: '#F1F8E9', icon: 'time' };
  if (days <= 30) return { label: `${days} Days Left`, color: '#4CAF50', bg: '#E8F5E9', icon: 'time' };
  return null; // More than 30 days — don't show badge
}

export default function ReceiptCard({ receipt, onPress }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Warranty/return badges
  const returnDays = daysUntil(receipt.return_expiry_date);
  const warrantyDays = daysUntil(receipt.warranty_expiry_date);
  const returnBadge = receipt.return_expiry_date ? getBadge(returnDays) : null;
  const warrantyBadge = receipt.warranty_expiry_date ? getBadge(warrantyDays) : null;

  // Skip badges for warranties > 30 days out
  const showReturnBadge = returnBadge && returnDays <= 30;
  const showWarrantyBadge = warrantyBadge && warrantyDays <= 30;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.merchant}>{receipt.merchant}</Text>
        <Text style={styles.amount}>AED {receipt.total?.toFixed(2)}</Text>
      </View>

      <View style={styles.details}>
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryIcon}>{receipt.categories?.icon || '📦'}</Text>
          <Text style={styles.categoryName}>{receipt.categories?.name || 'Other'}</Text>
        </View>
        <Text style={styles.date}>{formatDate(receipt.receipt_date)}</Text>
      </View>

      {/* Warranty & Return badges */}
      {(showReturnBadge || showWarrantyBadge) && (
        <View style={styles.badgeRow}>
          {showReturnBadge && (
            <View style={[styles.badge, { backgroundColor: returnBadge.bg }]}>
              <Ionicons name={returnBadge.icon} size={12} color={returnBadge.color} />
              <Text style={[styles.badgeText, { color: returnBadge.color }]}>
                Return: {returnBadge.label}
              </Text>
            </View>
          )}
          {showWarrantyBadge && (
            <View style={[styles.badge, { backgroundColor: warrantyBadge.bg }]}>
              <Ionicons name={warrantyBadge.icon} size={12} color={warrantyBadge.color} />
              <Text style={[styles.badgeText, { color: warrantyBadge.color }]}>
                Warranty: {warrantyBadge.label}
              </Text>
            </View>
          )}
        </View>
      )}

      {receipt.notes && (
        <View style={styles.notesContainer}>
          <Ionicons name="information-circle" size={16} color="#666" />
          <Text style={styles.notes}>{receipt.notes}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  merchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 10,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#666',
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  notes: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});