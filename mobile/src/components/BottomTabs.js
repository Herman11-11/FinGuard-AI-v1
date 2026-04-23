import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadow, typography } from '../theme/tokens';

const ITEMS = [
  { key: 'overview', label: 'Home' },
  { key: 'verify', label: 'Verify' },
  { key: 'qr', label: 'QR' },
  { key: 'legacy', label: 'Legacy' },
  { key: 'about', label: 'About' },
];

export default function BottomTabs({ activeTab, onChange }) {
  return (
    <View style={styles.outer}>
      <View style={styles.container}>
        {ITEMS.map((item) => {
          const active = item.key === activeTab;
          return (
            <Pressable
              key={item.key}
              onPress={() => onChange(item.key)}
              style={[styles.tab, active && styles.activeTab]}
            >
              <Text style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16,49,36,0.92)',
    borderRadius: 26,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...shadow.card,
  },
  tab: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.glassStrong,
  },
  label: {
    color: 'rgba(255,255,255,0.74)',
    fontFamily: typography.body,
    fontSize: 12,
    fontWeight: '700',
  },
  activeLabel: {
    color: colors.brand900,
  },
});
