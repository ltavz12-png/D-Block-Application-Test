import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing } from '@/constants/theme';

interface Country {
  name: string;
  code: string;
  dial: string;
  flag: string;
}

interface CountrySearchSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: Country) => void;
}

const COUNTRIES: Country[] = [
  { name: 'Georgia', code: 'GE', dial: '+995', flag: '\u{1F1EC}\u{1F1EA}' },
  { name: 'United States', code: 'US', dial: '+1', flag: '\u{1F1FA}\u{1F1F8}' },
  { name: 'United Kingdom', code: 'GB', dial: '+44', flag: '\u{1F1EC}\u{1F1E7}' },
  { name: 'Germany', code: 'DE', dial: '+49', flag: '\u{1F1E9}\u{1F1EA}' },
  { name: 'France', code: 'FR', dial: '+33', flag: '\u{1F1EB}\u{1F1F7}' },
  { name: 'Italy', code: 'IT', dial: '+39', flag: '\u{1F1EE}\u{1F1F9}' },
  { name: 'Spain', code: 'ES', dial: '+34', flag: '\u{1F1EA}\u{1F1F8}' },
  { name: 'Turkey', code: 'TR', dial: '+90', flag: '\u{1F1F9}\u{1F1F7}' },
  { name: 'Russia', code: 'RU', dial: '+7', flag: '\u{1F1F7}\u{1F1FA}' },
  { name: 'Armenia', code: 'AM', dial: '+374', flag: '\u{1F1E6}\u{1F1F2}' },
  { name: 'Azerbaijan', code: 'AZ', dial: '+994', flag: '\u{1F1E6}\u{1F1FF}' },
  { name: 'Ukraine', code: 'UA', dial: '+380', flag: '\u{1F1FA}\u{1F1E6}' },
  { name: 'Netherlands', code: 'NL', dial: '+31', flag: '\u{1F1F3}\u{1F1F1}' },
  { name: 'Switzerland', code: 'CH', dial: '+41', flag: '\u{1F1E8}\u{1F1ED}' },
  { name: 'Japan', code: 'JP', dial: '+81', flag: '\u{1F1EF}\u{1F1F5}' },
];

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.8;
const ROW_HEIGHT = 52;

export default function CountrySearchSheet({
  visible,
  onClose,
  onSelect,
}: CountrySearchSheetProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const query = search.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.dial.includes(query) ||
        c.code.toLowerCase().includes(query),
    );
  }, [search]);

  function handleSelect(country: Country) {
    onSelect(country);
    setSearch('');
  }

  function handleClose() {
    setSearch('');
    onClose();
  }

  function renderItem({ item }: { item: Country }) {
    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.6}
        onPress={() => handleSelect(item)}
      >
        <Text style={styles.flag}>{item.flag}</Text>
        <Text style={styles.countryName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.dialCode}>{item.dial}</Text>
        <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
      </TouchableOpacity>
    );
  }

  function renderSeparator() {
    return <View style={styles.divider} />;
  }

  function renderEmpty() {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={40} color="#C7C7CC" />
        <Text style={styles.emptyText}>Couldn't find a matching country</Text>
      </View>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.sheet}>
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <Text style={styles.title}>Choose</Text>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={16}
              color="#8E8E93"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search country or code"
              placeholderTextColor="#8E8E93"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color="#C7C7CC" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            renderItem={renderItem}
            ItemSeparatorComponent={renderSeparator}
            ListEmptyComponent={renderEmpty}
            getItemLayout={(_, index) => ({
              length: ROW_HEIGHT,
              offset: ROW_HEIGHT * index,
              index,
            })}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C7C7CC',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  searchIcon: {
    marginLeft: Spacing.xs,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 0,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
    paddingHorizontal: Spacing.md,
  },
  flag: {
    fontSize: 22,
    marginRight: Spacing.sm + 4,
  },
  countryName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: Colors.text,
  },
  dialCode: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93',
    marginRight: Spacing.sm,
  },
  divider: {
    height: 0.5,
    backgroundColor: '#E5E5EA',
    marginLeft: Spacing.md + 30,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xxl * 2,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93',
  },
});
