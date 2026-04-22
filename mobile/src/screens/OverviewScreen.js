import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import GlassCard from '../components/GlassCard';
import OfficialMark from '../components/OfficialMark';
import { colors, typography } from '../theme/tokens';

export default function OverviewScreen({ systemStatus, apiBaseUrl, onRefresh, onNavigate }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />
        <OfficialMark />
        <Text style={styles.heroTitle}>Digital trust in your hand, built for field work.</Text>
        <Text style={styles.heroText}>
          FinGuard Mobile will help officers verify title deeds, scan QR codes, and enroll legacy land documents without carrying the whole admin web experience into the field.
        </Text>
      </View>

      <GlassCard style={styles.statusCard}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.kicker}>Backend connection</Text>
            <Text style={styles.apiText}>{apiBaseUrl || 'Not configured'}</Text>
          </View>
          <Text style={[styles.statusBadge, systemStatus === 'online' ? styles.online : styles.offline]}>
            {systemStatus === 'online' ? 'Online' : systemStatus === 'offline' ? 'Offline' : 'Checking'}
          </Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={onRefresh}>
          <Text style={styles.primaryButtonText}>Refresh connection</Text>
        </Pressable>
      </GlassCard>

      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.stack}>
        <ActionCard
          title="Verify document"
          text="Capture or upload a title deed and send it to the registry for hash, AI fingerprint, and signature checks."
          action="Open verify"
          onPress={() => onNavigate('verify')}
        />
        <ActionCard
          title="Legacy capture"
          text="Enroll older title deeds into the secured registry with guided metadata entry and officer review."
          action="Open legacy"
          onPress={() => onNavigate('legacy')}
        />
      </View>

      <Text style={styles.sectionTitle}>Design note</Text>
      <GlassCard>
        <Text style={styles.noteTitle}>Coat of arms placement</Text>
        <Text style={styles.noteText}>
          The circular seal currently acts as a placeholder so we can lock the layout. We should replace it with the real Tanzania coat of arms asset and keep it only in the header and welcome areas.
        </Text>
      </GlassCard>
    </ScrollView>
  );
}

function ActionCard({ title, text, action, onPress }) {
  return (
    <GlassCard>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionText}>{text}</Text>
      <Pressable style={styles.ghostButton} onPress={onPress}>
        <Text style={styles.ghostButtonText}>{action}</Text>
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
  },
  hero: {
    backgroundColor: colors.brand900,
    borderRadius: 32,
    padding: 24,
    overflow: 'hidden',
    gap: 12,
  },
  heroGlowOne: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(70,166,123,0.18)',
    top: -70,
    right: -70,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(198,152,61,0.12)',
    bottom: -80,
    left: -50,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 30,
    lineHeight: 36,
    fontFamily: typography.display,
    fontWeight: '700',
    marginTop: 8,
  },
  heroText: {
    color: 'rgba(253,252,248,0.8)',
    lineHeight: 22,
    fontSize: 15,
  },
  statusCard: {
    gap: 14,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  kicker: {
    color: colors.ink600,
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
  },
  apiText: {
    color: colors.ink900,
    fontWeight: '600',
    maxWidth: '78%',
    marginTop: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontWeight: '700',
    fontSize: 12,
    overflow: 'hidden',
  },
  online: {
    backgroundColor: colors.successBg,
    color: colors.successText,
  },
  offline: {
    backgroundColor: colors.dangerBg,
    color: colors.dangerText,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brand900,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontWeight: '700',
    fontSize: 22,
    marginTop: 6,
  },
  stack: {
    gap: 12,
  },
  actionTitle: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontWeight: '700',
    fontSize: 22,
    marginBottom: 8,
  },
  actionText: {
    color: colors.ink700,
    lineHeight: 22,
    marginBottom: 16,
  },
  ghostButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  ghostButtonText: {
    color: colors.brand900,
    fontWeight: '700',
  },
  noteTitle: {
    color: colors.ink900,
    fontFamily: typography.display,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 8,
  },
  noteText: {
    color: colors.ink700,
    lineHeight: 21,
  },
});
