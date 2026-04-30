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
      <View style={styles.quickGrid}>
        <QuickActionButton label="Verify" onPress={() => onNavigate('verify')} />
        <QuickActionButton label="Scan QR" onPress={() => onNavigate('qr')} />
        <QuickActionButton label="Legacy" onPress={() => onNavigate('legacy')} />
        <QuickActionButton label="About" onPress={() => onNavigate('about')} />
      </View>
    </ScrollView>
  );
}

function QuickActionButton({ label, onPress }) {
  return (
    <Pressable style={styles.quickButton} onPress={onPress}>
      <Text style={styles.quickButtonText}>{label}</Text>
    </Pressable>
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
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickButton: {
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.66)',
  },
  quickButtonText: {
    color: colors.brand900,
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'center',
  },
});
