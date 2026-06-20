import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, FONT, SHADOW } from '../constants/design';

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
  if (days < 0)  return { label: 'Expired', color: 'danger', icon: 'alert-circle' };
  if (days === 0) return { label: 'Expires Today', color: 'danger', icon: 'warning' };
  if (days <= 3)  return { label: `${days} Day${days > 1 ? 's' : ''} Left`, color: 'orange', icon: 'warning' };
  if (days <= 7)  return { label: `${days} Days Left`, color: 'amber', icon: 'time' };
  if (days <= 14) return { label: `${days} Days Left`, color: 'amber', icon: 'time' };
  if (days <= 30) return { label: `${days} Days Left`, color: 'green', icon: 'time' };
  return null;
}

function getBadgeStyle(colorKey, colors) {
  const map = {
    danger:  { bg: colors.badgeRedBg,   text: colors.badgeRed },
    orange:  { bg: colors.badgeOrangeBg, text: colors.badgeOrange },
    amber:   { bg: colors.badgeAmberBg,  text: colors.badgeAmber },
    green:   { bg: colors.badgeGreenBg,  text: colors.badgeGreen },
  };
  return map[colorKey] || map.green;
}

export default function ReceiptCard({ receipt, onPress }) {
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const returnDays = daysUntil(receipt.return_expiry_date);
  const warrantyDays = daysUntil(receipt.warranty_expiry_date);
  const returnBadge = receipt.return_expiry_date ? getBadge(returnDays) : null;
  const warrantyBadge = receipt.warranty_expiry_date ? getBadge(warrantyDays) : null;

  const showReturnBadge = returnBadge && returnDays <= 30;
  const showWarrantyBadge = warrantyBadge && warrantyDays <= 30;

  return (
    <TouchableOpacity
      style={s.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Row 1: Merchant + Amount */}
      <View style={s.headerRow}>
        <View style={s.merchantBlock}>
          <Text style={s.merchant} numberOfLines={1}>{receipt.merchant}</Text>
        </View>
        <Text style={s.amount}>AED {receipt.total?.toFixed(2)}</Text>
      </View>

      {/* Row 2: Category + Date */}
      <View style={s.metaRow}>
        <View style={s.categoryPill}>
          <Text style={s.categoryIcon}>{receipt.categories?.icon || '📦'}</Text>
          <Text style={s.categoryName}>{receipt.categories?.name || 'Other'}</Text>
        </View>
        <Text style={s.date}>{formatDate(receipt.receipt_date)}</Text>
      </View>

      {/* Badges row */}
      {(showReturnBadge || showWarrantyBadge) && (
        <View style={s.badgeRow}>
          {showReturnBadge && (
            <BadgePill
              icon={returnBadge.icon}
              label={`Return: ${returnBadge.label}`}
              colors={colors}
              colorKey={returnBadge.color}
            />
          )}
          {showWarrantyBadge && (
            <BadgePill
              icon={warrantyBadge.icon}
              label={`Warranty: ${warrantyBadge.label}`}
              colors={colors}
              colorKey={warrantyBadge.color}
            />
          )}
        </View>
      )}

      {/* Notes (optional) */}
      {receipt.notes && (
        <View style={s.notesRow}>
          <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
          <Text style={s.notesText} numberOfLines={2}>{receipt.notes}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

/** Small inline badge pill */
function BadgePill({ icon, label, colors, colorKey }) {
  const palette = getBadgeStyle(colorKey, colors);
  return (
    <View style={[badgeStyles.pill, { backgroundColor: palette.bg }]}>
      <Ionicons name={icon} size={11} color={palette.text} />
      <Text style={[badgeStyles.label, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  label: {
    fontSize: FONT.sizes.caption,
    fontWeight: FONT.weights.semibold,
  },
});

const makeStyles = (c) => StyleSheet.create({
  card: {
    backgroundColor: c.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: c.border,
    ...SHADOW.sm(c.shadow),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  merchantBlock: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  merchant: {
    fontSize: FONT.sizes.bodyAlt,
    fontWeight: FONT.weights.semibold,
    color: c.text,
  },
  amount: {
    fontSize: FONT.sizes.bodyAlt,
    fontWeight: FONT.weights.bold,
    color: c.accent,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    gap: 5,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryName: {
    fontSize: FONT.sizes.label,
    color: c.textSecondary,
    fontWeight: FONT.weights.medium,
  },
  date: {
    fontSize: FONT.sizes.label,
    color: c.textMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.divider,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.divider,
    gap: 6,
  },
  notesText: {
    fontSize: FONT.sizes.label,
    color: c.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});
