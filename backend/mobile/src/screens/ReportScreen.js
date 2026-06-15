import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getReport } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';

export default function ReportScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getReport(selectedYear, selectedMonth + 1);
      setReport(data);
    } catch (err) {
      console.error('Failed to load report:', err);
      setError(err.message || 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [selectedMonth, selectedYear, isFocused]);

  const changeMonth = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Generating report...</Text>
      </View>
    );
  }

  if (error) {
    const isAuthError = error.includes('Invalid or expired token') || error.includes('No token provided');
    const isNoGroup = error.includes('not in a group');
    return (
      <View style={styles.errorContainer}>
        <Ionicons name={isAuthError ? 'lock-closed' : isNoGroup ? 'people-outline' : 'alert-circle'} size={48} color={isAuthError ? '#888' : 'red'} />
        <Text style={styles.errorTitle}>
          {isAuthError ? 'Session Expired' : isNoGroup ? 'No Group Yet' : 'Something went wrong'}
        </Text>
        <Text style={styles.errorText}>
          {isAuthError ? 'Please log in again to continue' : isNoGroup ? 'Create or join a group to see shared reports' : error}
        </Text>
        {!isAuthError && !isNoGroup && (
          <TouchableOpacity style={styles.retryButton} onPress={loadReport}>
            <Ionicons name="refresh" size={18} color="white" />
            <Text style={styles.retryButtonText}>  Try Again</Text>
          </TouchableOpacity>
        )}
        {isNoGroup && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.navigate('Group')}
          >
            <Ionicons name="people" size={18} color="white" />
            <Text style={styles.retryButtonText}>  Go to Groups</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!report || !report.summary) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="stats-chart-outline" size={80} color="#ddd" />
        <Text style={styles.emptyTitle}>No data available</Text>
        <Text style={styles.emptySubtext}>Start adding receipts to see your spending reports</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Scan')}
        >
          <Ionicons name="camera" size={20} color="white" />
          <Text style={styles.primaryButtonText}>Take a Photo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if there's any actual data
  const hasData = report.summary.receipt_count > 0;

  if (!hasData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNav}>
            <Ionicons name="chevron-back" size={24} color="#4CAF50" />
          </TouchableOpacity>

          <View style={styles.monthSelector}>
            <Text style={styles.monthText}>{monthNames[selectedMonth]} {selectedYear}</Text>
          </View>

          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNav}>
            <Ionicons name="chevron-forward" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color="#ddd" />
          <Text style={styles.emptyTitle}>No receipts this month</Text>
          <Text style={styles.emptySubtext}>
            Receipts you and your group members scan will show up here
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Scan')}
          >
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Scan a Receipt</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Prepare data for trend chart
  const trendData = {
    labels: report.trend.map(item => item.month.substring(5)),
    datasets: [
      {
        data: report.trend.map(item => item.total)
      }
    ]
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthNav}>
          <Ionicons name="chevron-back" size={24} color="#4CAF50" />
        </TouchableOpacity>

        <View style={styles.monthSelector}>
          <Text style={styles.monthText}>{monthNames[selectedMonth]} {selectedYear}</Text>
        </View>

        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNav}>
          <Ionicons name="chevron-forward" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Monthly Summary</Text>
        <Text style={styles.summaryAmount}>AED {report.summary.total_spent.toFixed(2)}</Text>
        <Text style={styles.summaryCount}>{report.summary.receipt_count} receipts</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spending Trend</Text>
        <View style={styles.chartContainer}>
          <BarChart
            data={trendData}
            width={350}
            height={220}
            yAxisLabel="AED "
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#fff',
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>By Category</Text>
        {report.by_category && report.by_category.length > 0 ? (
          report.by_category.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.category_name}</Text>
              </View>
              <View style={styles.categoryStats}>
                <Text style={styles.categoryAmount}>AED {category.total.toFixed(2)}</Text>
                <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No categories with spending this month</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>By Member</Text>
        {report.by_member && report.by_member.length > 0 ? (
          report.by_member.map((member, index) => (
            <View key={index} style={styles.memberItem}>
              <Text style={styles.memberName}>{member.display_name}</Text>
              <Text style={styles.memberAmount}>AED {member.total.toFixed(2)}</Text>
              <Text style={styles.memberCount}>{member.receipt_count} receipts</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No members with spending this month</Text>
        )}
      </View>

      <View style={styles.exportSection}>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download" size={20} color="white" />
          <Text style={styles.exportButtonText}>Export CSV</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  },
  loadingText: {
    marginTop: 15,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  monthNav: {
    padding: 10,
  },
  monthSelector: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryCard: {
    backgroundColor: '#4CAF50',
    padding: 25,
    margin: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  summaryAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  summaryCount: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 15,
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#666',
  },
  memberItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberAmount: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 5,
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  exportSection: {
    padding: 20,
    alignItems: 'center',
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  exportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
