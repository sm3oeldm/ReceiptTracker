import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getReport } from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';
import { Dimensions } from 'react-native';
import { SPACING, RADIUS, FONT, SHADOW } from '../constants/design';

const { width: screenWidth } = Dimensions.get('window');
const CHART_WIDTH = Math.min(screenWidth - SPACING.xl * 2 - SPACING.xl * 2, 400);

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function ReportScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [totalWidth, setTotalWidth] = useState(0);

  const loadReport = useCallback(async () => {
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
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadReport();
  }, [loadReport, isFocused]);

  const changeMonth = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    else if (newMonth > 11) { newMonth = 0; newYear++; }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <View style={s.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={s.loadingText}>Generating report...</Text>
      </View>
    );
  }

  // ── Error ──
  if (error) {
    const isAuthError = error.includes('Invalid or expired token') || error.includes('No token provided');
    const isNoGroup = error.includes('not in a group');
    return (
      <View style={s.centerContainer}>
        <View style={[s.statusCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Ionicons
            name={isAuthError ? 'lock-closed-outline' : isNoGroup ? 'people-outline' : 'alert-circle-outline'}
            size={48}
            color={isAuthError ? colors.textMuted : colors.danger}
          />
          <Text style={s.statusTitle}>
            {isAuthError ? 'Session Expired' : isNoGroup ? 'No Group Yet' : 'Something went wrong'}
          </Text>
          <Text style={s.statusSubtext}>
            {isAuthError ? 'Please log in again' : isNoGroup ? 'Create or join a group to see shared reports' : error}
          </Text>
          {!isAuthError && !isNoGroup && (
            <TouchableOpacity style={s.primaryButton} onPress={loadReport}>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={s.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
          {isNoGroup && (
            <TouchableOpacity style={s.primaryButton} onPress={() => navigation.navigate('Group')}>
              <Ionicons name="people-outline" size={18} color="#FFFFFF" />
              <Text style={s.primaryButtonText}>Go to Groups</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  const hasData = report?.summary?.receipt_count > 0;

  // ── Empty state (with month nav) ──
  if (!hasData) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={s.monthNav} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={24} color={colors.accent} />
          </TouchableOpacity>
          <Text style={s.monthText}>{monthNames[selectedMonth]} {selectedYear}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={s.monthNav} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-forward" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <View style={s.centerContainer}>
          <View style={[s.statusCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
            <Text style={s.statusTitle}>No receipts this month</Text>
            <Text style={s.statusSubtext}>
              Receipts you and your group members scan will show up here
            </Text>
            <TouchableOpacity style={s.primaryButton} onPress={() => navigation.navigate('Scan')}>
              <Ionicons name="camera-outline" size={18} color="#FFFFFF" />
              <Text style={s.primaryButtonText}>Scan a Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Chart data
  const trendData = {
    labels: report.trend.map((item) => item.month.substring(5)),
    datasets: [{ data: report.trend.map((item) => item.total) }],
  };

  return (
    <View style={s.container}>
      {/* Header with month picker */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={s.monthNav} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.accent} />
        </TouchableOpacity>
        <Text style={s.monthText}>{monthNames[selectedMonth]} {selectedYear}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={s.monthNav} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-forward" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary card - refined */}
        <View style={[s.summaryCard, { backgroundColor: colors.accent }]}>
          <Text style={s.summaryTitle}>Monthly Summary</Text>
          <Text style={s.summaryAmount}>AED {report.summary.total_spent.toFixed(2)}</Text>
          <View style={s.summaryMeta}>
            <View style={s.summaryMetaItem}>
              <Ionicons name="receipt-outline" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={s.summaryMetaText}>{report.summary.receipt_count} receipts</Text>
            </View>
          </View>
        </View>

        {/* Spending Trend */}
        <View style={[s.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <Ionicons name="trending-up-outline" size={16} color={colors.text} />
            <Text style={s.sectionTitle}>Spending Trend</Text>
          </View>
          <View style={s.chartContainer}>
            <BarChart
              data={trendData}
              width={CHART_WIDTH}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero
              showValuesOnTopOfBars
              withInnerLines={false}
              chartConfig={{
                backgroundColor: colors.cardBg,
                backgroundGradientFrom: colors.cardBg,
                backgroundGradientTo: colors.cardBg,
                decimalPlaces: 0,
                color: () => colors.accent,
                labelColor: () => colors.textMuted,
                barPercentage: 0.6,
                propsForBackgroundLines: {
                  strokeDasharray: '4 4',
                  stroke: colors.border,
                },
                propsForLabels: {
                  fontSize: 11,
                  fontWeight: '500',
                },
                style: { borderRadius: RADIUS.md },
              }}
              style={{ borderRadius: RADIUS.md }}
            />
          </View>
        </View>

        {/* By Category */}
        <View style={[s.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <Ionicons name="layers-outline" size={16} color={colors.text} />
            <Text style={s.sectionTitle}>By Category</Text>
          </View>
          {report.by_category && report.by_category.length > 0 ? (
            report.by_category.map((category, index) => (
              <View key={index} style={[s.row, index === report.by_category.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={s.rowLeft}>
                  <Text style={s.rowIcon}>{category.icon}</Text>
                  <Text style={s.rowName}>{category.category_name}</Text>
                </View>
                <View style={s.rowRight}>
                  <Text style={s.rowAmount}>AED {category.total.toFixed(2)}</Text>
                  <Text style={s.rowPercentage}>{category.percentage}%</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={s.noDataText}>No categories with spending this month</Text>
          )}
        </View>

        {/* By Member */}
        <View style={[s.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <Ionicons name="people-outline" size={16} color={colors.text} />
            <Text style={s.sectionTitle}>By Member</Text>
          </View>
          {report.by_member && report.by_member.length > 0 ? (
            report.by_member.map((member, index) => (
              <View key={index} style={[s.memberRow, index === report.by_member.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={s.memberAvatar}>
                  <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                </View>
                <View style={s.memberInfo}>
                  <Text style={s.memberName}>{member.display_name}</Text>
                  <Text style={s.memberCount}>{member.receipt_count} receipts</Text>
                </View>
                <Text style={s.memberAmount}>AED {member.total.toFixed(2)}</Text>
              </View>
            ))
          ) : (
            <Text style={s.noDataText}>No members with spending this month</Text>
          )}
        </View>

        {/* Export */}
        <View style={s.exportSection}>
          <TouchableOpacity style={s.exportButton}>
            <Ionicons name="download-outline" size={18} color="#FFFFFF" />
            <Text style={s.exportButtonText}>Export CSV</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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

    // ── Status card ──
    statusCard: {
      alignItems: 'center',
      padding: SPACING.xxxl,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      gap: SPACING.sm,
    },
    statusTitle: {
      fontSize: FONT.sizes.xl,
      fontWeight: FONT.weights.bold,
      color: c.text,
      textAlign: 'center',
    },
    statusSubtext: {
      fontSize: FONT.sizes.body,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: SPACING.sm,
    },

    // ── Header ──
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: Platform.OS === 'ios' ? 64 : 48,
      paddingHorizontal: SPACING.xl,
      paddingBottom: SPACING.lg,
      backgroundColor: c.headerBg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
    },
    monthNav: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    monthText: {
      fontSize: FONT.sizes.heading,
      fontWeight: FONT.weights.bold,
      color: c.text,
    },

    // ── Summary card ──
    summaryCard: {
      padding: SPACING.xxl,
      margin: SPACING.xl,
      borderRadius: RADIUS.lg,
    },
    summaryTitle: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: FONT.sizes.body,
      fontWeight: FONT.weights.medium,
      letterSpacing: 0.3,
    },
    summaryAmount: {
      color: '#FFFFFF',
      fontSize: FONT.sizes.hero,
      fontWeight: FONT.weights.heavy,
      letterSpacing: -0.5,
      marginVertical: SPACING.xs,
    },
    summaryMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.lg,
    },
    summaryMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    summaryMetaText: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: FONT.sizes.body,
      fontWeight: FONT.weights.medium,
    },

    // ── Section card ──
    sectionCard: {
      marginHorizontal: SPACING.xl,
      marginBottom: SPACING.md,
      padding: SPACING.xl,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: SPACING.lg,
    },
    sectionTitle: {
      fontSize: FONT.sizes.bodyAlt,
      fontWeight: FONT.weights.semibold,
      color: c.text,
    },
    chartContainer: {
      alignItems: 'center',
    },

    // ── Category rows ──
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: SPACING.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    rowIcon: {
      fontSize: 20,
    },
    rowName: {
      fontSize: FONT.sizes.body,
      color: c.text,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.md,
    },
    rowAmount: {
      fontSize: FONT.sizes.body,
      fontWeight: FONT.weights.semibold,
      color: c.accent,
    },
    rowPercentage: {
      fontSize: FONT.sizes.label,
      color: c.textMuted,
      minWidth: 36,
      textAlign: 'right',
    },

    // ── Member rows ──
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.divider,
      gap: SPACING.md,
    },
    memberAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.borderLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: FONT.sizes.body,
      fontWeight: FONT.weights.semibold,
      color: c.text,
    },
    memberCount: {
      fontSize: FONT.sizes.label,
      color: c.textMuted,
      marginTop: 1,
    },
    memberAmount: {
      fontSize: FONT.sizes.bodyAlt,
      fontWeight: FONT.weights.bold,
      color: c.accent,
    },

    // ── No data ──
    noDataText: {
      fontSize: FONT.sizes.body,
      color: c.textMuted,
      textAlign: 'center',
      paddingVertical: SPACING.md,
    },

    // ── Export ──
    exportSection: {
      padding: SPACING.xl,
      paddingTop: 0,
      alignItems: 'center',
    },
    exportButton: {
      flexDirection: 'row',
      backgroundColor: c.accent,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xxl,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      gap: 8,
    },
    exportButtonText: {
      color: '#FFFFFF',
      fontSize: FONT.sizes.bodyAlt,
      fontWeight: FONT.weights.semibold,
    },

    // ── Shared ──
    primaryButton: {
      flexDirection: 'row',
      backgroundColor: c.accent,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xxl,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      gap: 8,
      marginTop: SPACING.sm,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: FONT.sizes.bodyAlt,
      fontWeight: FONT.weights.semibold,
    },
  });
