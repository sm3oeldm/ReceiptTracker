import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parseReceipt, createReceipt, getCategories } from '../services/api';
import { useTheme } from '../context/ThemeContext';

function PressableScale({ onPress, disabled, style, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} disabled={disabled} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

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

  if (isParsing) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={s.parsingText}>Analyzing your receipt...</Text>
        <Text style={s.parsingSubtext}>Using AI to extract details</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.center}>
        <Ionicons name="alert-circle" size={64} color={colors.danger} />
        <Text style={s.errorTitle}>Could not read receipt</Text>
        <Text style={s.errorText}>{error}</Text>
        <PressableScale style={s.button} onPress={parseImage}>
          <Ionicons name="refresh" size={18} color="white" />
          <Text style={s.buttonText}>  Try Again</Text>
        </PressableScale>
        <TouchableOpacity style={s.linkButton} onPress={() => navigation.goBack()}>
          <Text style={[s.linkText, { color: colors.accent }]}>Take another photo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.imageContainer}>
          <Image source={{ uri: photoUri }} style={s.preview} />
        </View>

        <View style={s.form}>
          <Text style={s.sectionTitle}>Receipt Details</Text>
          <Text style={s.hint}>Edit any incorrect fields before saving</Text>

          <Text style={s.label}>Merchant</Text>
          <TextInput
            style={s.input}
            value={merchant}
            onChangeText={setMerchant}
            placeholder="Store name"
            placeholderTextColor={colors.textMuted}
          />

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

          <Text style={s.label}>Date</Text>
          <TextInput
            style={s.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={s.label}>Category</Text>
          {categories.length > 0 ? (
            <View style={s.categoryContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.categoryList}
              >
                {categories.map(cat => (
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
            </View>
          ) : (
            <TouchableOpacity style={s.categoryPlaceholder} onPress={loadCategories}>
              <Ionicons name="refresh" size={18} color={colors.accent} />
              <Text style={[s.categoryPlaceholderText, { color: colors.accent }]}>  Load categories</Text>
            </TouchableOpacity>
          )}

          {/* Warranty & Return toggle */}
          <TouchableOpacity
            style={s.warrantyToggle}
            onPress={() => setShowWarranty(!showWarranty)}
          >
            <Ionicons name={showWarranty ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
            <Text style={s.warrantyToggleText}>Warranty & Return</Text>
            {(warrantyDuration || returnPeriod) && (
              <View style={[s.warrantyBadge, { backgroundColor: colors.accentLight }]}>
                <Text style={[s.warrantyBadgeText, { color: colors.accent }]}>has data</Text>
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
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()} disabled={isSaving}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <PressableScale style={[s.saveBtn, isSaving && s.savingBtn]} onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={s.saveText}>  Save Receipt</Text>
              </>
            )}
          </PressableScale>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  scroll: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: c.bg,
  },
  parsingText: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
    marginTop: 20,
  },
  parsingSubtext: {
    fontSize: 14,
    color: c.textMuted,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: c.text,
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: c.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  imageContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: c.cardBg,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  preview: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
  },
  form: {
    backgroundColor: c.cardBg,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: c.text,
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: c.textMuted,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    height: 48,
    borderColor: c.inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: c.inputBg,
    color: c.text,
  },
  totalRow: {
    flexDirection: 'row',
    gap: 10,
  },
  currencyInput: {
    width: 80,
    textAlign: 'center',
  },
  amountInput: {
    flex: 1,
  },
  categoryContainer: {
    marginTop: 4,
  },
  categoryList: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
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
    fontSize: 13,
    fontWeight: '500',
    color: c.textSecondary,
  },
  categoryNameSelected: {
    color: c.accent,
    fontWeight: '700',
  },
  categoryPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: c.accent,
    borderStyle: 'dashed',
  },
  categoryPlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
  },
  warrantyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  warrantyToggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: c.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  warrantyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  warrantyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  warrantySection: {
    marginTop: 12,
    paddingTop: 8,
  },
  warrantyHint: {
    fontSize: 13,
    color: c.textMuted,
    marginBottom: 8,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.inputBorder,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: c.textSecondary,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: c.accent,
  },
  savingBtn: {
    opacity: 0.7,
  },
  saveText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: c.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 8,
  },
  linkText: {
    fontSize: 15,
  },
});
