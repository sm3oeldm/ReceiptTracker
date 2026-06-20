import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getReceiptById } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, FONT, SHADOW } from '../constants/design';

// ── Helpers ──

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
  if (days < 0)  return { label: `${label} Expired`,     severity: 'danger'  };
  if (days === 0) return { label: `${label} Expires Today`, severity: 'danger' };
  if (days <= 3)  return { label: `${label}: ${days} Day${days > 1 ? 's' : ''} Left`, severity: 'orange' };
  if (days <= 7)  return { label: `${label}: ${days} Days Left`, severity: 'amber' };
  if (days <= 30) return { label: `${label}: ${days} Days Left`, severity: 'green' };
  return { label: `${label}: ${days} Days Left`, severity: 'muted' };
}

function getSeverityColor(severity, colors) {
  const map = {
    danger:  { bg: colors.badgeRedBg,   text: colors.badgeRed,    icon: 'alert-circle' },
    orange:  { bg: colors.badgeOrangeBg, text: colors.badgeOrange, icon: 'warning' },
    amber:   { bg: colors.badgeAmberBg,  text: colors.badgeAmber,  icon: 'time' },
    green:   { bg: colors.badgeGreenBg,  text: colors.badgeGreen,  icon: 'time' },
    muted:   { bg: colors.borderLight,   text: colors.textMuted,   icon: 'time' },
  };
  return map[severity] || map.muted;
}

// ── Screen ──

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

  // ── Loading ──
  if (loading) {
    return (
      <View style={s.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <View style={s.centerContainer}>
        <View style={[s.errorCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={s.emptyTitle}>Could not load receipt</Text>
          <Text style={s.emptySubtext}>{error}</Text>
          <TouchableOpacity style={s.primaryButton} onPress={loadReceipt}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={s.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!receipt) return null;

  const returnDays = daysUntil(receipt.return_expiry_date);
  const warrantyDays = daysUntil(receipt.warranty_expiry_date);
  const returnBadge = receipt.return_expiry_date ? getBadge(returnDays, 'return') : null;
  const warrantyBadge = receipt.warranty_expiry_date ? getBadge(warrantyDays, 'warranty') : null;
  const currency = receipt.currency || 'AED';
  const hasWarrantyData = receipt.warranty_duration || receipt.warranty_expiry_date ||
    receipt.return_period || receipt.return_expiry_date || receipt.warranty_notes;

  return (
    <View style={s.container}>
      {/* Header bar */}
      <View style={s.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.headerBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Details</Text>
        <View style={s.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Receipt Info Card ── */}
        <View style={[s.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={s.merchantRow}>
            <View style={[s.merchantIconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="storefront-outline" size={20} color={colors.accent} />
            </View>
            <View style={s.merchantBlock}>
              <Text style={s.merchant}>{receipt.merchant}</Text>
              <View style={s.categoryPill}>
                <Text style={s.categoryIcon}>{receipt.categories?.icon || '📦'}</Text>
                <Text style={s.categoryName}>{receipt.categories?.name || 'Other'}</Text>
              </View>
            </View>
            <Text style={s.total}>{currency} {receipt.total?.toFixed(2)}</Text>
          </View>

          <View style={s.divider} />

          <View style={s.infoRow}>
            <View style={s.infoItem}>
              <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
              <Text style={s.infoText}>{receipt.receipt_date}</Text>
            </View>
          </View>

          {receipt.notes && (
            <View style={s.notesBox}>
              <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
              <Text style={s.notesText}>{receipt.notes}</Text>
            </View>
          )}
        </View>

        {/* ── Items Card ── */}
        {receipt.items && receipt.items.length > 0 && (
          <View style={[s.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={s.sectionHeader}>
              <Ionicons name="list-outline" size={16} color={colors.text} />
              <Text style={s.sectionTitle}>Items</Text>
            </View>
            {receipt.items.map((item, idx) => (
              <View key={idx} style={[s.itemRow, idx === receipt.items.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={s.itemName}>{item.name}</Text>
                <Text style={s.itemPrice}>{currency} {parseFloat(item.price).toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Warranty & Return Card ── */}
        {hasWarrantyData && (
          <View style={[s.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={s.sectionHeader}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.text} />
              <Text style={s.sectionTitle}>Warranty & Return</Text>
            </View>

            {receipt.warranty_duration && (
              <View style={s.warrantyRow}>
                <Ionicons name="shield-outline" size={15} color={colors.textMuted} />
                <Text style={s.warrantyText}>Warranty: {receipt.warranty_duration}</Text>
              </View>
            )}
            {receipt.return_period && (
              <View style={s.warrantyRow}>
                <Ionicons name="refresh-outline" size={15} color={colors.textMuted} />
                <Text style={s.warrantyText}>Return: {receipt.return_period}</Text>
              </View>
            )}

            {returnBadge && (
              <StatusBlock
                badge={returnBadge}
                severity={returnBadge.severity}
                colors={colors}
                expiryDate={receipt.return_expiry_date}
                label="Return deadline"
              />
            )}

            {warrantyBadge && (
              <StatusBlock
                badge={warrantyBadge}
                severity={warrantyBadge.severity}
                colors={colors}
                expiryDate={receipt.warranty_expiry_date}
                label="Warranty expires"
              />
            )}

            {receipt.warranty_notes && (
              <View style={s.notesBox}>
                <Ionicons name="document-text-outline" size={15} color={colors.textMuted} />
                <Text style={s.notesText}>{receipt.warranty_notes}</Text>
              </View>
            )}
          </View>
        )}

        {receipt.extracted_by_gemini && (
          <View style={s.aiBadge}>
            <Ionicons name="sparkles" size={13} color={colors.textMuted} />
            <Text style={s.aiBadgeText}>Warranty info extracted by AI</Text>
          </View>
        )}

        <View style={{ height: SPACING.huge }} />
      </ScrollView>
    </View>
  );
}

/** Status badge block for warranty/return expiry */
function StatusBlock({ badge, severity, colors, expiryDate, label }) {
  const palette = getSeverityColor(severity, colors);
  return (
    <View style={[statusStyles.block, { backgroundColor: palette.bg }]}>
      <Ionicons name={palette.icon} size={18} color={palette.text} />
      <View style={statusStyles.content}>
        <Text style={[statusStyles.label, { color: palette.text }]}>{badge.label}</Text>
        {expiryDate && (
          <Text style={[statusStyles.detail, { color: colors.textMuted }]}>
            {label}: {expiryDate}
          </Text>
        )}
      </View>
    </View>
  );
}

const statusStyles = StyleSheet.create({
  block: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  content: { flex: 1 },
  label: {
    fontSize: FONT.sizes.body,
    fontWeight: FONT.weights.bold,
  },
  detail: {
    fontSize: FONT.sizes.label,
    marginTop: 2,
  },
});

// ── Styles ──

const makeStyles = (c) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xxxl,
      backgroundColor: c.bg,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Platform.OS === 'ios' ? 64 : 48,
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.md,
      backgroundColor: c.headerBg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
    },
    headerBtn: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: FONT.sizes.bodyAlt,
      fontWeight: FONT.weights.semibold,
      color: c.text,
    },
    scrollContent: {
      padding: SPACING.lg,
    },

    // ── Error card ──
    errorCard: {
      alignItems: 'center',
      padding: SPACING.xxxl,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      gap: SPACING.sm,
    },
    emptyTitle: {
      fontSize: FONT.sizes.xl,
      fontWeight: FONT.weights.bold,
      color: c.text,
      marginBottom: SPACING.xs,
    },
    emptySubtext: {
      fontSize: FONT.sizes.body,
      color: c.textMuted,
      textAlign: 'center',
      marginBottom: SPACING.xl,
      lineHeight: 22,
    },

    // ── Card ──
    card: {
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      marginBottom: SPACING.md,
      borderWidth: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: SPACING.md,
    },
    sectionTitle: {
      fontSize: FONT.sizes.bodyAlt,
      fontWeight: FONT.weights.semibold,
      color: c.text,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.divider,
      marginVertical: SPACING.md,
    },

    // ── Receipt header ──
    merchantRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    merchantIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    merchantBlock: {
      flex: 1,
    },
    merchant: {
      fontSize: FONT.sizes.xl,
      fontWeight: FONT.weights.bold,
      color: c.text,
    },
    categoryPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    categoryIcon: {
      fontSize: 14,
    },
    categoryName: {
      fontSize: FONT.sizes.label,
      color: c.textSecondary,
    },
    total: {
      fontSize: FONT.sizes.largeTitle,
      fontWeight: FONT.weights.bold,
      color: c.accent,
      letterSpacing: -0.5,
    },

    // ── Info row ──
    infoRow: {
      flexDirection: 'column',
      gap: SPACING.sm,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    infoText: {
      fontSize: FONT.sizes.body,
      color: c.textSecondary,
    },
    notesBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      marginTop: SPACING.md,
      paddingTop: SPACING.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.divider,
    },
    notesText: {
      fontSize: FONT.sizes.body,
      color: c.textSecondary,
      flex: 1,
      lineHeight: 20,
    },

    // ── Items ──
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: SPACING.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
    },
    itemName: {
      fontSize: FONT.sizes.body,
      color: c.text,
      flex: 1,
    },
    itemPrice: {
      fontSize: FONT.sizes.body,
      fontWeight: FONT.weights.semibold,
      color: c.textSecondary,
      marginLeft: SPACING.sm,
    },

    // ── Warranty ──
    warrantyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 4,
    },
    warrantyText: {
      fontSize: FONT.sizes.body,
      color: c.textSecondary,
    },

    // ── Buttons ──
    primaryButton: {
      flexDirection: 'row',
      backgroundColor: c.accent,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xxl,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      gap: 8,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: FONT.sizes.bodyAlt,
      fontWeight: FONT.weights.semibold,
    },

    // ── AI badge ──
    aiBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: SPACING.sm,
    },
    aiBadgeText: {
      fontSize: FONT.sizes.label,
      color: c.textMuted,
    },
  });
