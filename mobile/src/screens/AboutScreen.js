import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassCard from '../components/GlassCard';
import OfficialMark from '../components/OfficialMark';
import { colors, typography } from '../theme/tokens';

export default function AboutScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <OfficialMark compact />
        <Text style={styles.title}>About FinGuard Mobile</Text>
        <Text style={styles.subtitle}>
          A field-ready companion to the FinGuard web system for verifying deeds, scanning registry QR codes, and enrolling legacy land records.
        </Text>
      </View>

      <GlassCard>
        <Text style={styles.cardTitle}>How to use this app</Text>
        <Step title="1. Verify">
          Use the Verify screen to capture or choose a deed image or PDF and send it to the registry for trust checks.
        </Step>
        <Step title="2. Scan QR">
          Use the QR screen to scan the printed deed code and quickly look up the official registry record.
        </Step>
        <Step title="3. Legacy Capture">
          Use the Legacy screen to bring older title deeds into the protected system with metadata and document upload.
        </Step>
      </GlassCard>

      <GlassCard>
        <Text style={styles.cardTitle}>What each result means</Text>
        <StatusRow label="Authentic" tone={styles.authentic}>The registry found a trusted match and the deed passed key verification checks.</StatusRow>
        <StatusRow label="Suspicious" tone={styles.suspicious}>Some signals matched, but the record should be reviewed more carefully.</StatusRow>
        <StatusRow label="Forged" tone={styles.forged}>The uploaded deed did not align with trusted registry signals.</StatusRow>
      </GlassCard>

      <GlassCard>
        <Text style={styles.cardTitle}>Field guidance</Text>
        <Text style={styles.body}>- Capture documents in good lighting.</Text>
        <Text style={styles.body}>- Keep the full deed visible in the frame.</Text>
        <Text style={styles.body}>- Use QR scan for the fastest lookup when the printed code is clear.</Text>
        <Text style={styles.body}>- For older deeds, fill metadata carefully before submission.</Text>
      </GlassCard>
    </ScrollView>
  );
}

function Step({ title, children }) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

function StatusRow({ label, tone, children }) {
  return (
    <View style={styles.statusWrap}>
      <Text style={[styles.statusBadge, tone]}>{label}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
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
    marginBottom: 10,
  },
  stepWrap: {
    gap: 6,
    marginBottom: 14,
  },
  stepTitle: {
    color: colors.brand900,
    fontWeight: '800',
  },
  statusWrap: {
    gap: 8,
    marginBottom: 14,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    backgroundColor: 'rgba(255,255,255,0.56)',
  },
  authentic: {
    color: colors.successText,
  },
  suspicious: {
    color: colors.warningText,
  },
  forged: {
    color: colors.dangerText,
  },
  body: {
    color: colors.ink700,
    lineHeight: 21,
  },
});
