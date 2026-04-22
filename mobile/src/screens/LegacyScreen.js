import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassCard from '../components/GlassCard';
import OfficialMark from '../components/OfficialMark';
import { colors, typography } from '../theme/tokens';

export default function LegacyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <OfficialMark compact />
        <Text style={styles.title}>Legacy title capture</Text>
        <Text style={styles.subtitle}>
          Built for older deeds that need to be brought into the protected digital registry.
        </Text>
      </View>

      <GlassCard>
        <Text style={styles.cardTitle}>Capture flow</Text>
        <Text style={styles.cardBody}>The first version will guide officers through photo capture, metadata entry, and secure submission.</Text>
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Start capture flow</Text>
        </Pressable>
      </GlassCard>

      <GlassCard>
        <Text style={styles.cardTitle}>Enrollment checks</Text>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Hash</Text><Text style={styles.infoValue}>Generated on submit</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>AI fingerprint</Text><Text style={styles.infoValue}>Generated on submit</Text></View>
        <View style={styles.infoRow}><Text style={styles.infoLabel}>Officer review</Text><Text style={styles.infoValue}>Optional secure workflow</Text></View>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
  },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  title: {
    marginTop: 14,
    color: colors.ink900,
    fontFamily: typography.display,
    fontWeight: '700',
    fontSize: 28,
  },
  subtitle: {
    marginTop: 8,
    color: colors.ink700,
    lineHeight: 22,
  },
  cardTitle: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontWeight: '700',
    fontSize: 22,
    marginBottom: 8,
  },
  cardBody: {
    color: colors.ink700,
    lineHeight: 21,
    marginBottom: 16,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand900,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16,24,40,0.08)',
  },
  infoLabel: {
    color: colors.ink700,
    fontWeight: '700',
  },
  infoValue: {
    color: colors.ink900,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
});
