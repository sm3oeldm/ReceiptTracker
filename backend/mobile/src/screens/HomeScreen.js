import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getReceipts, getWarranties } from '../services/api';
import { AuthContext } from '../context/AuthContext';
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
 * Get badge config for the dashboard widget.
 */
function getWidgetBadge(days) {
  if (days === null) return null;
  if (days < 0) return { label: 'Expired', color: '#e74c3c', bg: '#FDEDED' };
  if (days === 0) return { label: 'Expires Today', color: '#e67e22', bg: '#FFF3E0' };
  if (days <= 3) return { label: `${days} Day${days > 1 ? 's' : ''}`, color: '#e67e22', bg: '#FFF3E0' };
  if (days <= 7) return { label: `${days} Days`, color: '#f1c40f', bg: '#FFFDE7' };
  if (days <= 14) return { label: `${days} Days`, color: '#8bc34a', bg: '#F1F8E9' };
  if (days <= 30) return { label: `${days} Days`, color: '#4CAF50', bg: '#E8F5E9' };
  return { label: `${days} Days`, color: '#999', bg: '#f5f5f5' };
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [receipts, setReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  // Warranty/return dashboard data
  const [warranties, setWarranties] = useState([]);
  const [warrantiesLoading, setWarrantiesLoading] = useState(true);

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

  const loadWarranties = async () => {
    try {
      setWarrantiesLoading(true);
      const data = await getWarranties();
      setWarranties(data || []);
    } catch (err) {
      console.error('Failed to load warranties:', err);
      setWarranties([]);
    } finally {
      setWarrantiesLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadReceipts();
      loadWarranties();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReceipts();
    loadWarranties();
  };

  // Build dashboard items from warranty data
  const expiringReturns = warranties
    .filter(r => r.return_expiry_date)
    .map(r => ({
      ...r,
      _daysLeft: daysUntil(r.return_expiry_date),
      _type: 'return',
    }))
    .filter(r => r._daysLeft !== null && r._daysLeft <= 14)
    .sort((a, b) => a._daysLeft - b._daysLeft)
    .slice(0, 5);

  const expiringWarranties = warranties
    .filter(r => r.warranty_expiry_date)
    .map(r => ({
      ...r,
      _daysLeft: daysUntil(r.warranty_expiry_date),
      _type: 'warranty',
    }))
    .filter(r => r._daysLeft !== null && r._daysLeft <= 30)
    .sort((a, b) => a._daysLeft - b._daysLeft)
    .slice(0, 5);

  const hasDashboardItems = expiringReturns.length > 0 || expiringWarranties.length > 0;

  const renderReceiptItem = ({ item }) => (
    <ReceiptCard
      receipt={item}
      onPress={() => navigation.navigate('ReceiptDetail', { receiptId: item.id })}
    />
  );

  const renderHeader = () => {
    if (!hasDashboardItems) return null;

    return (
      <View style={styles.dashboardContainer}>
        {/* Dashboard Header */}
        <View style={styles.dashboardHeader}>
          <Ionicons name="shield-checkmark" size={18} color="#4CAF50" />
          <Text style={styles.dashboardTitle}>Warranties & Returns</Text>
        </View>

        {/* Expiring Returns */}
        {expiringReturns.length > 0 && (
          <View style={styles.dashboardSection}>
            <Text style={styles.dashboardSectionTitle}>
              <Ionicons name="refresh" size={14} color="#e67e22" /> Returns Expiring Soon
            </Text>
            {expiringReturns.map(item => {
              const badge = getWidgetBadge(item._daysLeft);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.dashboardItem}
                  onPress={() => navigation.navigate('ReceiptDetail', { receiptId: item.id })}
                >
                  <View style={styles.dashboardItemLeft}>
                    <Text style={styles.dashboardItemMerchant} numberOfLines={1}>
                      {item.merchant}
                    </Text>
                    <Text style={styles.dashboardItemDate}>
                      Expires: {item.return_expiry_date}
                    </Text>
                  </View>
                  <View style={[styles.dashboardBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.dashboardBadgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Expiring Warranties */}
        {expiringWarranties.length > 0 && (
          <View style={styles.dashboardSection}>
            <Text style={styles.dashboardSectionTitle}>
              <Ionicons name="shield" size={14} color="#4CAF50" /> Warranties Expiring Soon
            </Text>
            {expiringWarranties.map(item => {
              const badge = getWidgetBadge(item._daysLeft);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.dashboardItem}
                  onPress={() => navigation.navigate('ReceiptDetail', { receiptId: item.id })}
                >
                  <View style={styles.dashboardItemLeft}>
                    <Text style={styles.dashboardItemMerchant} numberOfLines={1}>
                      {item.merchant}
                    </Text>
                    <Text style={styles.dashboardItemDate}>
                      Expires: {item.warranty_expiry_date}
                    </Text>
                  </View>
                  <View style={[styles.dashboardBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.dashboardBadgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Divider */}
        <View style={styles.dashboardDivider} />
      </View>
    );
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your receipts...</Text>
      </View>
    );
  }

  // Auth error — session expired (auto-logout already triggered)
  if (error && (error.includes('Invalid or expired token') || error.includes('No token provided'))) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="lock-closed" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>Session Expired</Text>
        <Text style={styles.emptySubtext}>Please log in again</Text>
      </View>
    );
  }

  // Other errors (network, etc.)
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cloud-offline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>Something went wrong</Text>
        <Text style={styles.emptySubtext}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={loadReceipts}>
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>This Month</Text>
          <Text style={styles.headerSubtitle}>Your Recent Receipts</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="settings-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {receipts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="receipt-outline" size={80} color="#ddd" />
          <Text style={styles.emptyTitle}>No receipts yet</Text>
          <Text style={styles.emptySubtext}>You don't have any receipts this month. Start by scanning your first receipt!</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Scan')}
          >
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Take a Photo</Text>
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
              tintColor="#4CAF50"
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* FAB to quickly take a photo */}
      {receipts.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('Scan')}
        >
          <Ionicons name="camera" size={28} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 15,
    color: '#666',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  settingsButton: {
    padding: 4,
    marginTop: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
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
    marginBottom: 12,
    gap: 6,
  },
  dashboardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  dashboardSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  dashboardSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  dashboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dashboardItemLeft: {
    flex: 1,
    marginRight: 10,
  },
  dashboardItemMerchant: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  dashboardItemDate: {
    fontSize: 12,
    color: '#999',
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
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#4CAF50',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
