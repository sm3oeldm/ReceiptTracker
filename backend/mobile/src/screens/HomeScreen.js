import React, { useState, useEffect, useContext, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getReceipts } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import ReceiptCard from '../components/ReceiptCard';

/**
 * Calculate days until a target date.
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
 * Compute expiring items from loaded receipts data.
 */
function computeExpiring(receipts) {
  const returns = receipts
    .filter(r => r.return_expiry_date)
    .map(r => ({ ...r, _daysLeft: daysUntil(r.return_expiry_date) }))
    .filter(r => r._daysLeft !== null && r._daysLeft <= 14)
    .sort((a, b) => a._daysLeft - b._daysLeft)
    .slice(0, 5);

  const warranties = receipts
    .filter(r => r.warranty_expiry_date)
    .map(r => ({ ...r, _daysLeft: daysUntil(r.warranty_expiry_date) }))
    .filter(r => r._daysLeft !== null && r._daysLeft <= 30)
    .sort((a, b) => a._daysLeft - b._daysLeft)
    .slice(0, 5);

  return { returns, warranties };
}

function getBadge(days) {
  if (days === null) return null;
  if (days < 0) return { label: 'Expired', color: '#e74c3c', bg: '#FDEDED' };
  if (days === 0) return { label: 'Today', color: '#e67e22', bg: '#FFF3E0' };
  if (days <= 3) return { label: `${days}d`, color: '#e67e22', bg: '#FFF3E0' };
  if (days <= 7) return { label: `${days}d`, color: '#f1c40f', bg: '#FFFDE7' };
  if (days <= 14) return { label: `${days}d`, color: '#8bc34a', bg: '#F1F8E9' };
  return { label: `${days}d`, color: '#4CAF50', bg: '#E8F5E9' };
}

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

  const loadReceipts = async () => {
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
  };

  useEffect(() => {
    if (isFocused) {
      loadReceipts();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReceipts();
  };

  // Compute expiring items from loaded receipts (no extra API call)
  const { returns: expiringReturns, warranties: expiringWarranties } = computeExpiring(receipts);
  const hasAny = expiringReturns.length > 0 || expiringWarranties.length > 0;

  const renderReceiptItem = ({ item }) => (
    <ReceiptCard
      receipt={item}
      onPress={() => navigation.navigate('ReceiptDetail', { receiptId: item.id })}
    />
  );

  const renderHeader = () => (
    <View style={s.dashboardContainer}>
      <View style={s.dashboardHeader}>
        <Ionicons name="shield-checkmark" size={18} color={colors.accent} />
        <Text style={s.dashboardTitle}>Warranties & Returns</Text>
      </View>

      {!hasAny ? (
        <View style={s.noneRow}>
          <Ionicons name="checkmark-circle" size={16} color={colors.textMuted} />
          <Text style={s.noneText}>None</Text>
        </View>
      ) : (
        <>
          {expiringReturns.length > 0 && (
            <View style={s.dashboardSection}>
              <Text style={s.dashboardSectionTitle}>
                <Ionicons name="refresh" size={13} color="#e67e22" /> Returns Expiring Soon
              </Text>
              {expiringReturns.map(item => {
                const badge = getBadge(item._daysLeft);
                return (
                  <View key={item.id} style={s.dashboardItem}>
                    <View style={s.dashboardItemLeft}>
                      <Text style={s.dashboardItemMerchant} numberOfLines={1}>
                        {item.merchant}
                      </Text>
                      <Text style={s.dashboardItemDate}>
                        Expires {item.return_expiry_date}
                      </Text>
                    </View>
                    <View style={[s.dashboardBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[s.dashboardBadgeText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {expiringWarranties.length > 0 && (
            <View style={s.dashboardSection}>
              <Text style={s.dashboardSectionTitle}>
                <Ionicons name="shield" size={13} color={colors.accent} /> Warranties Expiring Soon
              </Text>
              {expiringWarranties.map(item => {
                const badge = getBadge(item._daysLeft);
                return (
                  <View key={item.id} style={s.dashboardItem}>
                    <View style={s.dashboardItemLeft}>
                      <Text style={s.dashboardItemMerchant} numberOfLines={1}>
                        {item.merchant}
                      </Text>
                      <Text style={s.dashboardItemDate}>
                        Expires {item.warranty_expiry_date}
                      </Text>
                    </View>
                    <View style={[s.dashboardBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[s.dashboardBadgeText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
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
  );

  if (isLoading && !refreshing) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={s.loadingText}>Loading your receipts...</Text>
      </View>
    );
  }

  // Auth error — session expired (auto-logout already triggered)
  if (error && (error.includes('Invalid or expired token') || error.includes('No token provided'))) {
    return (
      <View style={s.centerContainer}>
        <Ionicons name="lock-closed" size={64} color={colors.textMuted} />
        <Text style={s.emptyTitle}>Session Expired</Text>
        <Text style={s.emptySubtext}>Please log in again</Text>
      </View>
    );
  }

  // Other errors (network, etc.)
  if (error) {
    return (
      <View style={s.centerContainer}>
        <Ionicons name="cloud-offline" size={64} color={colors.textMuted} />
        <Text style={s.emptyTitle}>Something went wrong</Text>
        <Text style={s.emptySubtext}>{error}</Text>
        <TouchableOpacity style={s.primaryButton} onPress={loadReceipts}>
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={s.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>This Month</Text>
          <Text style={s.headerSubtitle}>Your Recent Receipts</Text>
        </View>
        <TouchableOpacity
          style={s.settingsButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {receipts.length === 0 ? (
        <View style={s.centerContainer}>
          <Ionicons name="receipt-outline" size={80} color={colors.textMuted} />
          <Text style={s.emptyTitle}>No receipts yet</Text>
          <Text style={s.emptySubtext}>You don't have any receipts this month. Start by scanning your first receipt!</Text>
          <TouchableOpacity
            style={s.primaryButton}
            onPress={() => navigation.navigate('Scan')}
          >
            <Ionicons name="camera" size={20} color="white" />
            <Text style={s.primaryButtonText}>Take a Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={receipts}
          renderItem={renderReceiptItem}
          keyExtractor={item => item.id}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          contentContainerStyle={s.listContent}
        />
      )}

      {/* FAB to quickly take a photo */}
      {receipts.length > 0 && (
        <TouchableOpacity
          style={s.fab}
          onPress={() => navigation.navigate('Scan')}
        >
          <Ionicons name="camera" size={28} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: c.bg,
  },
  loadingText: {
    marginTop: 15,
    color: c.textSecondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: c.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: c.headerBg,
  },
  settingsButton: {
    padding: 4,
    marginTop: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: c.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: c.textSecondary,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: c.text,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: c.textMuted,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: c.accent,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  listContent: {
    padding: 20,
    paddingBottom: 80,
  },
  // Dashboard widget styles
  dashboardContainer: {
    marginBottom: 12,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  dashboardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
  },
  noneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  noneText: {
    fontSize: 14,
    color: c.textMuted,
  },
  dashboardSection: {
    backgroundColor: c.cardBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  dashboardSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textSecondary,
    marginBottom: 10,
  },
  dashboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: c.borderLight,
  },
  dashboardItemLeft: {
    flex: 1,
    marginRight: 10,
  },
  dashboardItemMerchant: {
    fontSize: 14,
    fontWeight: '500',
    color: c.text,
  },
  dashboardItemDate: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 2,
  },
  dashboardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dashboardBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dashboardDivider: {
    height: 1,
    backgroundColor: c.border,
    marginVertical: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: c.accent,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
