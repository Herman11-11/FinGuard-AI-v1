import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassCard from '../components/GlassCard';
import OfficialMark from '../components/OfficialMark';
import { colors, typography } from '../theme/tokens';

export default function VerifyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <OfficialMark compact />
        <Text style={styles.title}>Verify title deed</Text>
        <Text style={styles.subtitle}>
          This screen will become the main field verification flow: capture, upload, preview, and verify.
        </Text>
      </View>

      <GlassCard>
        <Text style={styles.cardTitle}>Capture or upload</Text>
        <Text style={styles.cardBody}>Camera, gallery, and PDF selection buttons will live here.</Text>
        <View style={styles.buttonRow}>
          <Pressable style={styles.primaryButton}><Text style={styles.primaryButtonText}>Open camera</Text></Pressable>
          <Pressable style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Choose file</Text></Pressable>
        </View>
      </GlassCard>

      <GlassCard>
        <Text style={styles.cardTitle}>Verification result design</Text>
        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Authentic</Text>
          <Text style={styles.resultText}>Record ID: LAND-XXXXXXX</Text>
          <Text style={styles.resultMeta}>Hash matched • AI fingerprint matched • Registry record found</Text>
        </View>
        <Text style={styles.cardBody}>We’ll wire this to the backend verification endpoint next.</Text>
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
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  primaryButton: {
    backgroundColor: colors.brand900,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  secondaryButtonText: {
    color: colors.brand900,
    fontWeight: '700',
  },
  resultCard: {
    marginTop: 8,
    marginBottom: 14,
    backgroundColor: colors.successBg,
    borderRadius: 18,
    padding: 16,
    gap: 6,
  },
  resultLabel: {
    color: colors.successText,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  resultText: {
    color: colors.ink900,
    fontWeight: '700',
  },
  resultMeta: {
    color: colors.ink700,
    lineHeight: 20,
  },
});
