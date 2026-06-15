import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parseReceipt, createReceipt, getCategories } from '../services/api';

export default function ReceiptConfirmScreen({ route, navigation }) {
  const { photoUri } = route.params;

  const [isParsing, setIsParsing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const [merchant, setMerchant] = useState('');
  const [total, setTotal] = useState('');
  const [date, setDate] = useState('');
  const [currency, setCurrency] = useState('AED');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    loadCategories();
    parseImage();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
      // Auto-select the first default category if available
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
      });
      Alert.alert('Saved!', 'Receipt has been saved successfully.', [
        { text: 'OK', onPress: () => navigation.navigate('HomeTabs') },
      ]);
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', err.message || 'Failed to save receipt');
    } finally {
      setIsSaving(false);
    }
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategory) return null;
    const cat = categories.find(c => c.id === selectedCategory);
    return cat ? `${cat.icon || ''} ${cat.name}`.trim() : 'Select category';
  };

  // Parsing in progress
  if (isParsing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.parsingText}>Analyzing your receipt...</Text>
        <Text style={styles.parsingSubtext}>Using AI to extract details</Text>
      </View>
    );
  }

  // Parsing failed
  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={64} color="#e74c3c" />
        <Text style={styles.errorTitle}>Could not read receipt</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={parseImage}>
          <Ionicons name="refresh" size={18} color="white" />
          <Text style={styles.buttonText}>  Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Take another photo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Photo preview */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: photoUri }} style={styles.preview} />
        </View>

        {/* Extracted fields */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Receipt Details</Text>
          <Text style={styles.hint}>Edit any incorrect fields before saving</Text>

          <Text style={styles.label}>Merchant</Text>
          <TextInput
            style={styles.input}
            value={merchant}
            onChangeText={setMerchant}
            placeholder="Store name"
          />

          <Text style={styles.label}>Total</Text>
          <View style={styles.totalRow}>
            <TextInput
              style={[styles.input, styles.currencyInput]}
              value={currency}
              onChangeText={setCurrency}
              placeholder="AED"
              autoCapitalize="characters"
            />
            <TextInput
              style={[styles.input, styles.amountInput]}
              value={total}
              onChangeText={setTotal}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>

          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />

          {/* Category selector */}
          <Text style={styles.label}>Category</Text>
          {categories.length > 0 ? (
            <View style={styles.categoryContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
              >
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === cat.id && styles.categoryChipSelected,
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon || '📦'}</Text>
                    <Text
                      style={[
                        styles.categoryName,
                        selectedCategory === cat.id && styles.categoryNameSelected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.categoryPlaceholder}
              onPress={loadCategories}
            >
              <Ionicons name="refresh" size={18} color="#4CAF50" />
              <Text style={styles.categoryPlaceholderText}>  Load categories</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            disabled={isSaving}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.savingBtn]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.saveText}>  Save Receipt</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scroll: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#f5f5f5',
  },
  parsingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
  },
  parsingSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  imageContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
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
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: '#999',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    height: 48,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#333',
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
  // Category styles
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
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
    gap: 4,
  },
  categoryChipSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555',
  },
  categoryNameSelected: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  categoryPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  categoryPlaceholderText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
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
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
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
    backgroundColor: '#4CAF50',
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
    color: '#4CAF50',
    fontSize: 15,
  },
});
