import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getReceipts } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ReceiptCard from '../components/ReceiptCard';
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

function computeExpiring(receipts) {
  const returns = receipts
    .filter((r) => r.return_expiry_date)
    .map((r) => ({ ...r, _daysLeft: daysUntil(r.return_expiry_date) }))
    .filter((r) => r._daysLeft !== null && r._daysLeft <= 14)
    .sort((a, b) => a._daysLeft - b._daysLeft)
    .slice(0, 5);

  const warranties = receipts
    .filter((r) => r.warranty_expiry_date)
    .map((r) => ({ ...r, _daysLeft: daysUntil(r.warranty_expiry_date) }))
    .filter((r) => r._daysLeft !== null && r._daysLeft <= 30)
    .sort((a, b) => a._daysLeft - b._daysLeft)
    .slice(0, 5);

  return { returns, warranties };
}

function getBadgeStyle(days) {
  if (days === null) return null;
  if (days < 0)  return { label: 'Expired',   severity: 'danger' };
  if (days === 0) return { label: 'Today',     severity: 'danger' };
  if (days <= 3)  return { label: `${days}d`,  severity: 'orange' };
  if (days <= 7)  return { label: `${days}d`,  severity: 'amber'  };
  if (days <= 14) return { label: `${days}d`,  severity: 'amber'  };
  return { label: `${days}d`, severity: 'green' };
}

function getSeverityColor(severity, colors) {
  const map = {
    danger:  { bg: colors.badgeRedBg,   text: colors.badgeRed },
    orange:  { bg: colors.badgeOrangeBg, text: colors.badgeOrange },
    amber:   { bg: colors.badgeAmberBg,  text: colors.badgeAmber },
    green:   { bg: colors.badgeGreenBg,  text: colors.badgeGreen },
  };
  return map[severity] || map.green;
}

// ── Sub-components ──

function SummaryMetric({ icon, label, value, color }) {
  const { colors } = useTheme();
  return (
    <View style={[summaryStyles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <View style={[summaryStyles.iconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[summaryStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[summaryStyles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  value: {
    fontSize: FONT.sizes.title,
    fontWeight: FONT.weights.bold,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: FONT.sizes.label,
    fontWeight: FONT.weights.medium,
  },
});

// ── Main Screen ──

export default function HomeScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const loadReceipts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const data = await getReceipts(currentMonth, currentYear);
      setReceipts(data);
    } catch (err) {
      console.error('Failed to load receipts:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) loadReceipts();
  }, [isFocused, loadReceipts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReceipts();
  }, [loadReceipts]);

  const { returns: expiringReturns, warranties: expiringWarranties } =
    useMemo(() => computeExpiring(receipts), [receipts]);
  const hasExpiring = expiringReturns.length > 0 || expiringWarranties.length > 0;

  // ── Summary stats ──
  const totalThisMonth = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
  const countThisMonth = receipts.length;
  const merchants = new Set(receipts.map((r) => r.merchant)).size;

  // ── Render helpers ──

  const renderReceiptItem = useCallback(
    ({ item }) => (
      <ReceiptCard
        receipt={item}
        onPress={() => navigation.navigate('ReceiptDetail', { receiptId: item.id })}
      />
    ),
    [navigation],
  );

  const keyExtractor = useCallback((item) => item.id, []);

  const renderHeader = () => (
    <View>
      {/* Summary metrics */}
      {receipts.length > 0 && (
        <View style={s.summaryRow}>
          <SummaryMetric icon="receipt-outline" label="Receipts" value={countThisMonth} color={colors.accent} />
          <View style={{ width: 10 }} />
          <SummaryMetric icon="storefront-outline" label="Stores" value={merchants} color={colors.info} />
          <View style={{ width: 10 }} />
          <SummaryMetric icon="wallet-outline" label="Total" value={totalThisMonth.toFixed(0)} color={colors.warning} />
        </View>
      )}

      {/* Warranty & Returns Dashboard */}
      <View style={s.dashboardWrap}>
        <View style={s.dashboardTitleRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} />
          <Text style={s.dashboardTitle}>Warranties & Returns</Text>
        </View>

        {!hasExpiring ? (
          <View style={[s.dashboardCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={s.noneRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
              <Text style={s.noneText}>No upcoming expirations</Text>
            </View>
          </View>
        ) : (
          <>
            {expiringReturns.length > 0 && (
              <View style={[s.dashboardCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={s.sectionTagRow}>
                  <Ionicons name="refresh-outline" size={14} color={colors.badgeOrange} />
                  <Text style={[s.sectionTagLabel, { color: colors.badgeOrange }]}>Returns Expiring</Text>
                </View>
                {expiringReturns.map((item) => {
                  const badge = getBadgeStyle(item._daysLeft);
                  const palette = getSeverityColor(badge.severity, colors);
                  return (
                    <View key={item.id} style={s.dashboardItem}>
                      <View style={s.dashboardItemLeft}>
                        <Text style={s.itemMerchant} numberOfLines={1}>{item.merchant}</Text>
                        <Text style={s.itemExpiry}>Expires {item.return_expiry_date}</Text>
                      </View>
                      <View style={[s.badge, { backgroundColor: palette.bg }]}>
                        <Text style={[s.badgeText, { color: palette.text }]}>{badge.label}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {expiringWarranties.length > 0 && (
              <View style={[s.dashboardCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={s.sectionTagRow}>
                  <Ionicons name="shield-outline" size={14} color={colors.badgeGreen} />
                  <Text style={[s.sectionTagLabel, { color: colors.badgeGreen }]}>Warranties Expiring</Text>
                </View>
                {expiringWarranties.map((item) => {
                  const badge = getBadgeStyle(item._daysLeft);
                  const palette = getSeverityColor(badge.severity, colors);
                  return (
                    <View key={item.id} style={s.dashboardItem}>
                      <View style={s.dashboardItemLeft}>
                        <Text style={s.itemMerchant} numberOfLines={1}>{item.merchant}</Text>
                        <Text style={s.itemExpiry}>Expires {item.warranty_expiry_date}</Text>
                      </View>
                      <View style={[s.badge, { backgroundColor: palette.bg }]}>
                        <Text style={[s.badgeText, { color: palette.text }]}>{badge.label}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        <View style={s.dashboardDivider} />
      </View>
    </View>
  );

  // ── Loading state ──
  if (isLoading && !refreshing) {
    return (
      <View style={s.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={s.loadingText}>Loading your receipts...</Text>
      </View>
    );
  }

  // ── Session error ──
  if (error && (error.includes('Invalid or expired token') || error.includes('No token provided'))) {
    return (
      <View style={s.centerContainer}>
        <View style={[s.errorCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.textMuted} />
          <Text style={s.emptyTitle}>Session Expired</Text>
          <Text style={s.emptySubtext}>Please log in again</Text>
        </View>
      </View>
    );
  }

  // ── Network / other error ──
  if (error) {
    return (
      <View style={s.centerContainer}>
        <View style={[s.errorCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={s.emptyTitle}>Something went wrong</Text>
          <Text style={s.emptySubtext}>{error}</Text>
          <TouchableOpacity style={s.primaryButton} onPress={loadReceipts}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={s.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main view ──
  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerGreeting}>
            {user?.display_name ? `Hi, ${user.display_name.split(' ')[0]}` : 'Hi there'}
          </Text>
          <Text style={s.headerSubtitle}>This Month's Receipts</Text>
        </View>
        <TouchableOpacity
          style={s.settingsButton}
          onPress={() => navigation.navigate('Profile')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="person-circle-outline" size={28} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {receipts.length === 0 ? (
        <View style={s.centerContainer}>
          <View style={[s.emptyCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
            </View>
            <Text style={s.emptyTitle}>No receipts yet</Text>
            <Text style={s.emptySubtext}>
              You don't have any receipts this month. Scan your first receipt to get started!
            </Text>
            <TouchableOpacity
              style={s.primaryButton}
              onPress={() => navigation.navigate('Scan')}
            >
              <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
              <Text style={s.primaryButtonText}>Scan a Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={receipts}
          renderItem={renderReceiptItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      {receipts.length > 0 && (
        <TouchableOpacity
          style={s.fab}
          onPress={() => navigation.navigate('Scan')}
          activeOpacity={0.85}
        >
          <Ionicons name="camera-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

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
    loadingText: {
      marginTop: SPACING.md,
      fontSize: FONT.sizes.body,
      color: c.textSecondary,
    },

    // ── Header ──
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingTop: Platform.OS === 'ios' ? 64 : 48,
      paddingHorizontal: SPACING.xl,
      paddingBottom: SPACING.lg,
      backgroundColor: c.headerBg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
    },
    headerGreeting: {
      fontSize: FONT.sizes.title,
      fontWeight: FONT.weights.bold,
      color: c.text,
    },
    headerSubtitle: {
      fontSize: FONT.sizes.body,
      color: c.textSecondary,
      marginTop: 2,
    },
    settingsButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // ── Summary row ──
    summaryRow: {
      flexDirection: 'row',
      marginBottom: SPACING.xl,
    },

    // ── Dashboard (warranty / returns) ──
    dashboardWrap: {
      marginBottom: SPACING.sm,
    },
    dashboardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: SPACING.md,
    },
    dashboardTitle: {
      fontSize: FONT.sizes.bodyAlt,
      fontWeight: FONT.weights.semibold,
      color: c.text,
    },
    dashboardCard: {
      borderRadius: RADIUS.md,
      padding: SPACING.lg,
      marginBottom: SPACING.sm,
      borderWidth: 1,
    },
    noneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    noneText: {
      fontSize: FONT.sizes.body,
      color: c.textSecondary,
    },
    sectionTagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: SPACING.sm,
    },
    sectionTagLabel: {
      fontSize: FONT.sizes.label,
      fontWeight: FONT.weights.semibold,
    },
    dashboardItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: SPACING.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.divider,
    },
    dashboardItemLeft: {
      flex: 1,
      marginRight: SPACING.sm,
    },
    itemMerchant: {
      fontSize: FONT.sizes.body,
      fontWeight: FONT.weights.medium,
      color: c.text,
    },
    itemExpiry: {
      fontSize: FONT.sizes.label,
      color: c.textMuted,
      marginTop: 1,
    },
    badge: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 3,
      borderRadius: RADIUS.sm,
    },
    badgeText: {
      fontSize: FONT.sizes.caption,
      fontWeight: FONT.weights.bold,
    },
    dashboardDivider: {
      height: SPACING.md,
    },

    // ── List ──
    listContent: {
      padding: SPACING.xl,
      paddingBottom: 100,
    },

    // ── Empty / Error cards ──
    emptyCard: {
      alignItems: 'center',
      padding: SPACING.xxxl,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
    },
    emptyIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.borderLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
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
      lineHeight: 22,
      marginBottom: SPACING.xl,
    },
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

    // ── FAB ──
    fab: {
      position: 'absolute',
      right: SPACING.xl,
      bottom: SPACING.xl,
      backgroundColor: c.accent,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      ...SHADOW.lg(c.shadow),
      elevation: 8,
    },
  });
