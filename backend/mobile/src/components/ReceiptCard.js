import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

function daysUntil(dateString) {
  if (!dateString) return null;
  const target = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

function getBadge(days) {
  if (days === null) return null;
  if (days < 0) return { label: 'Expired', color: '#e74c3c', bg: '#FDEDED', icon: 'alert-circle' };
  if (days === 0) return { label: 'Expires Today', color: '#e67e22', bg: '#FFF3E0', icon: 'warning' };
  if (days <= 3) return { label: `${days} Day${days > 1 ? 's' : ''} Left`, color: '#e67e22', bg: '#FFF3E0', icon: 'warning' };
  if (days <= 7) return { label: `${days} Days Left`, color: '#f1c40f', bg: '#FFFDE7', icon: 'time' };
  if (days <= 14) return { label: `${days} Days Left`, color: '#8bc34a', bg: '#F1F8E9', icon: 'time' };
  if (days <= 30) return { label: `${days} Days Left`, color: '#4CAF50', bg: '#E8F5E9', icon: 'time' };
  return null;
}

export default function ReceiptCard({ receipt, onPress }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const returnDays = daysUntil(receipt.return_expiry_date);
  const warrantyDays = daysUntil(receipt.warranty_expiry_date);
  const returnBadge = receipt.return_expiry_date ? getBadge(returnDays) : null;
  const warrantyBadge = receipt.warranty_expiry_date ? getBadge(warrantyDays) : null;

  const showReturnBadge = returnBadge && returnDays <= 30;
  const showWarrantyBadge = warrantyBadge && warrantyDays <= 30;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.7}>
      <View style={s.header}>
        <Text style={s.merchant}>{receipt.merchant}</Text>
        <Text style={s.amount}>AED {receipt.total?.toFixed(2)}</Text>
      </View>

      <View style={s.details}>
        <View style={s.categoryContainer}>
          <Text style={s.categoryIcon}>{receipt.categories?.icon || '📦'}</Text>
          <Text style={s.categoryName}>{receipt.categories?.name || 'Other'}</Text>
        </View>
        <Text style={s.date}>{formatDate(receipt.receipt_date)}</Text>
      </View>

      {(showReturnBadge || showWarrantyBadge) && (
        <View style={s.badgeRow}>
          {showReturnBadge && (
            <View style={[s.badge, { backgroundColor: returnBadge.bg }]}>
              <Ionicons name={returnBadge.icon} size={12} color={returnBadge.color} />
              <Text style={[s.badgeText, { color: returnBadge.color }]}>
                Return: {returnBadge.label}
              </Text>
            </View>
          )}
          {showWarrantyBadge && (
            <View style={[s.badge, { backgroundColor: warrantyBadge.bg }]}>
              <Ionicons name={warrantyBadge.icon} size={12} color={warrantyBadge.color} />
              <Text style={[s.badgeText, { color: warrantyBadge.color }]}>
                Warranty: {warrantyBadge.label}
              </Text>
            </View>
          )}
        </View>
      )}

      {receipt.notes && (
        <View style={s.notesContainer}>
          <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
          <Text style={s.notes}>{receipt.notes}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (c) => StyleSheet.create({
  card: {
    backgroundColor: c.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: c.shadow,
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
    color: c.text,
    flex: 1,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: c.accent,
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
    color: c.textSecondary,
  },
  date: {
    fontSize: 14,
    color: c.textMuted,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  notes: {
    fontSize: 14,
    color: c.textSecondary,
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
    borderTopColor: c.border,
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
