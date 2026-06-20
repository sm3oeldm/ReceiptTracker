import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, KeyboardAvoidingView,
  Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parseReceipt, createReceipt, getCategories } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, FONT, SHADOW } from '../constants/design';

// ── PressableScale (micro-interaction) ──
function PressableScale({ onPress, disabled, style, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        activeOpacity={0.85}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Screen ──

export default function ReceiptConfirmScreen({ route, navigation }) {
  const { photoUri } = route.params;
  const { colors } = useTheme();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [isParsing, setIsParsing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const [merchant, setMerchant] = useState('');
  const [total, setTotal] = useState('');
  const [date, setDate] = useState('');
  const [currency, setCurrency] = useState('AED');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Warranty & return fields
  const [warrantyDuration, setWarrantyDuration] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [returnPeriod, setReturnPeriod] = useState('');
  const [returnExpiry, setReturnExpiry] = useState('');
  const [warrantyNotes, setWarrantyNotes] = useState('');
  const [showWarranty, setShowWarranty] = useState(false);

  useEffect(() => {
    loadCategories();
    parseImage();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
      if (data && data.length > 0) {
        setSelectedCategory(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const parseImage = async () => {
    try {
      setIsParsing(true);
      setError(null);
      const result = await parseReceipt(photoUri);

      setMerchant(result.merchant || '');
      setTotal(result.total?.toString() || '');
      setDate(result.date || '');
      setCurrency(result.currency || 'AED');

      const hasWarranty = result.warranty_duration || result.return_period || result.warranty_notes;
      if (hasWarranty) {
        setWarrantyDuration(result.warranty_duration || '');
        setReturnPeriod(result.return_period || '');
        setWarrantyNotes(result.warranty_notes || '');
        setShowWarranty(!!hasWarranty);
      }
    } catch (err) {
      console.error('Parse error:', err);
      setError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    if (!merchant.trim()) {
      Alert.alert('Missing Info', 'Please enter the merchant name.');
      return;
    }
    if (!total || isNaN(parseFloat(total))) {
      Alert.alert('Invalid Total', 'Please enter a valid total amount.');
      return;
    }
    if (!date.trim()) {
      Alert.alert('Missing Date', 'Please enter the receipt date.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      Alert.alert('Invalid Date', 'Please use YYYY-MM-DD format (e.g. 2026-06-15)');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Missing Category', 'Please select a category for this receipt.');
      return;
    }

    try {
      setIsSaving(true);
      await createReceipt({
        merchant: merchant.trim(),
        total: parseFloat(total),
        currency: currency || 'AED',
        date: date.trim(),
        category_id: selectedCategory,
        warranty_duration: warrantyDuration.trim() || null,
        warranty_expiry_date: warrantyExpiry.trim() || null,
        return_period: returnPeriod.trim() || null,
        return_expiry_date: returnExpiry.trim() || null,
        warranty_notes: warrantyNotes.trim() || null,
        extracted_by_gemini: !!(warrantyDuration || returnPeriod || warrantyNotes),
      });
      Alert.alert('Saved!', 'Receipt has been saved successfully.', [
        { text: 'OK', onPress: () => navigation.navigate('HomeTabs', { screen: 'Home' }) },
      ]);
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', err.message || 'Failed to save receipt');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Parsing state ──
  if (isParsing) {
    return (
      <View style={s.centerContainer}>
        <View style={[s.statusCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={s.statusTitle}>Analyzing your receipt</Text>
          <Text style={s.statusSubtext}>Using AI to extract details</Text>
        </View>
      </View>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <View style={s.centerContainer}>
        <View style={[s.statusCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <Text style={s.statusTitle}>Could not read receipt</Text>
          <Text style={s.statusSubtext}>{error}</Text>
          <PressableScale style={s.primaryButton} onPress={parseImage}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={s.primaryButtonText}>Try Again</Text>
          </PressableScale>
          <TouchableOpacity style={s.linkButton} onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.accent, fontSize: FONT.sizes.body, fontWeight: FONT.weights.medium }}>
              Take another photo
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Form ──
  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo preview */}
        <View style={[s.imageWrap, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Image source={{ uri: photoUri }} style={s.preview} />
        </View>

        {/* Form card */}
        <View style={[s.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={s.formTitle}>Receipt Details</Text>
          <Text style={s.formHint}>Edit any incorrect fields before saving</Text>

          {/* Merchant */}
          <Text style={s.label}>Merchant</Text>
          <TextInput
            style={s.input}
            value={merchant}
            onChangeText={setMerchant}
            placeholder="Store name"
            placeholderTextColor={colors.textMuted}
          />

          {/* Total */}
          <Text style={s.label}>Total</Text>
          <View style={s.totalRow}>
            <TextInput
              style={[s.input, s.currencyInput]}
              value={currency}
              onChangeText={setCurrency}
              placeholder="AED"
              autoCapitalize="characters"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[s.input, s.amountInput]}
              value={total}
              onChangeText={setTotal}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Date */}
          <Text style={s.label}>Date</Text>
          <TextInput
            style={s.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
          />

          {/* Category */}
          <Text style={s.label}>Category</Text>
          {categories.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.categoryList}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    s.categoryChip,
                    selectedCategory === cat.id && s.categoryChipSelected,
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text style={s.categoryIcon}>{cat.icon || '📦'}</Text>
                  <Text
                    style={[
                      s.categoryName,
                      selectedCategory === cat.id && s.categoryNameSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity style={s.categoryPlaceholder} onPress={loadCategories}>
              <Ionicons name="refresh" size={18} color={colors.accent} />
              <Text style={[s.categoryPlaceholderText, { color: colors.accent }]}>  Load categories</Text>
            </TouchableOpacity>
          )}

          {/* Warranty toggle */}
          <TouchableOpacity style={s.warrantyToggle} onPress={() => setShowWarranty(!showWarranty)}>
            <Ionicons name={showWarranty ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
            <Text style={s.warrantyToggleText}>Warranty & Return</Text>
            {(warrantyDuration || returnPeriod) && (
              <View style={[s.warrantyTag, { backgroundColor: colors.accentLight }]}>
                <Text style={[s.warrantyTagText, { color: colors.accent }]}>has data</Text>
              </View>
            )}
          </TouchableOpacity>

          {showWarranty && (
            <View style={s.warrantySection}>
              <Text style={s.warrantyHint}>Add warranty and return policy info from your receipt</Text>

              <Text style={s.label}>Warranty Duration</Text>
              <TextInput
                style={s.input}
                value={warrantyDuration}
                onChangeText={setWarrantyDuration}
                placeholder="e.g. 2 years, 90 days"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={s.label}>Warranty Expiry Date</Text>
              <TextInput
                style={s.input}
                value={warrantyExpiry}
                onChangeText={setWarrantyExpiry}
                placeholder="YYYY-MM-DD (optional)"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={s.label}>Return Period</Text>
              <TextInput
                style={s.input}
                value={returnPeriod}
                onChangeText={setReturnPeriod}
                placeholder="e.g. 14 days, 30 days"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={s.label}>Return Expiry Date</Text>
              <TextInput
                style={s.input}
                value={returnExpiry}
                onChangeText={setReturnExpiry}
                placeholder="YYYY-MM-DD (optional)"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={s.label}>Warranty Notes</Text>
              <TextInput
                style={[s.input, s.notesInput]}
                value={warrantyNotes}
                onChangeText={setWarrantyNotes}
                placeholder="Any additional warranty details..."
                placeholderTextColor={colors.textMuted}
                multiline
              />
            </View>
          )}

          {/* Actions */}
          <View style={s.actions}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()} disabled={isSaving}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <PressableScale
              style={[s.saveBtn, isSaving && s.savingBtn]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={s.saveText}>Save Receipt</Text>
                </>
              )}
            </PressableScale>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ──

const makeStyles = (c) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    scrollContent: {
      paddingBottom: SPACING.huge,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xxxl,
      backgroundColor: c.bg,
    },

    // ── Status card (loading / error) ──
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
      marginTop: SPACING.sm,
    },
    statusSubtext: {
      fontSize: FONT.sizes.body,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: SPACING.sm,
    },

    // ── Image preview ──
    imageWrap: {
      margin: SPACING.lg,
      borderRadius: RADIUS.lg,
      overflow: 'hidden',
      borderWidth: 1,
    },
    preview: {
      width: '100%',
      height: 200,
      resizeMode: 'contain',
    },

    // ── Form card ──
    formCard: {
      marginHorizontal: SPACING.lg,
      marginBottom: SPACING.lg,
      borderRadius: RADIUS.lg,
      padding: SPACING.xl,
      borderWidth: 1,
    },
    formTitle: {
      fontSize: FONT.sizes.heading,
      fontWeight: FONT.weights.bold,
      color: c.text,
      marginBottom: 2,
    },
    formHint: {
      fontSize: FONT.sizes.body,
      color: c.textMuted,
      marginBottom: SPACING.xl,
    },

    // ── Inputs ──
    label: {
      fontSize: FONT.sizes.label,
      fontWeight: FONT.weights.semibold,
      color: c.textSecondary,
      marginBottom: 5,
      marginTop: SPACING.md,
    },
    input: {
      height: 48,
      borderColor: c.inputBorder,
      borderWidth: 1,
      borderRadius: RADIUS.sm,
      paddingHorizontal: SPACING.md,
      fontSize: FONT.sizes.bodyAlt,
      backgroundColor: c.inputBg,
      color: c.text,
    },
    totalRow: {
      flexDirection: 'row',
      gap: SPACING.sm,
    },
    currencyInput: {
      width: 80,
      textAlign: 'center',
    },
    amountInput: {
      flex: 1,
    },
    notesInput: {
      height: 80,
      textAlignVertical: 'top',
      paddingTop: SPACING.md,
    },

    // ── Category chips ──
    categoryList: {
      flexDirection: 'row',
      gap: SPACING.sm,
      paddingVertical: SPACING.xs,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.full,
      borderWidth: 1.5,
      borderColor: c.inputBorder,
      backgroundColor: c.inputBg,
      gap: 4,
    },
    categoryChipSelected: {
      borderColor: c.accent,
      backgroundColor: c.accentLight,
    },
    categoryIcon: {
      fontSize: 16,
    },
    categoryName: {
      fontSize: FONT.sizes.label,
      fontWeight: FONT.weights.medium,
      color: c.textSecondary,
    },
    categoryNameSelected: {
      color: c.accent,
      fontWeight: FONT.weights.bold,
    },
    categoryPlaceholder: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.sm,
      borderWidth: 1.5,
      borderColor: c.accent,
      borderStyle: 'dashed',
    },
    categoryPlaceholderText: {
      fontSize: FONT.sizes.body,
      fontWeight: FONT.weights.medium,
    },

    // ── Warranty ──
    warrantyToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: SPACING.xl,
      paddingTop: SPACING.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.divider,
    },
    warrantyToggleText: {
      fontSize: FONT.sizes.bodyAlt,
      fontWeight: FONT.weights.semibold,
      color: c.textSecondary,
      marginLeft: SPACING.sm,
      flex: 1,
    },
    warrantyTag: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: 2,
      borderRadius: RADIUS.sm,
    },
    warrantyTagText: {
      fontSize: FONT.sizes.caption,
      fontWeight: FONT.weights.semibold,
    },
    warrantySection: {
      marginTop: SPACING.md,
      paddingTop: SPACING.sm,
    },
    warrantyHint: {
      fontSize: FONT.sizes.body,
      color: c.textMuted,
      marginBottom: SPACING.sm,
    },

    // ── Actions ──
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: SPACING.xxl,
      gap: SPACING.md,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.sm,
      borderWidth: 1,
      borderColor: c.inputBorder,
      alignItems: 'center',
    },
    cancelText: {
      fontSize: FONT.sizes.bodyAlt,
      fontWeight: FONT.weights.semibold,
      color: c.textSecondary,
    },
    saveBtn: {
      flex: 2,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.sm,
      backgroundColor: c.accent,
      gap: 6,
    },
    savingBtn: {
      opacity: 0.7,
    },
    saveText: {
      fontSize: FONT.sizes.bodyAlt,
      fontWeight: FONT.weights.bold,
      color: '#FFFFFF',
    },

    // ── Shared buttons ──
    primaryButton: {
      flexDirection: 'row',
      backgroundColor: c.accent,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xxl,
      borderRadius: RADIUS.sm,
      alignItems: 'center',
      gap: 8,
      marginTop: SPACING.sm,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: FONT.sizes.bodyAlt,
      fontWeight: FONT.weights.semibold,
    },
    linkButton: {
      padding: SPACING.sm,
      marginTop: SPACING.xs,
    },
  });
