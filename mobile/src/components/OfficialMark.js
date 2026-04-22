import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, shadow, typography } from '../theme/tokens';

export default function OfficialMark({ compact = false }) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={[styles.seal, compact && styles.sealCompact]}>
        <View style={styles.innerRing}>
          <Text style={[styles.sealText, compact && styles.sealTextCompact]}>TZ</Text>
        </View>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, compact && styles.titleCompact]}>Ministry of Lands</Text>
        <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>United Republic of Tanzania</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wrapCompact: {
    gap: 10,
  },
  seal: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.soft,
  },
  sealCompact: {
    width: 46,
    height: 46,
  },
  innerRing: {
    width: '82%',
    height: '82%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(198,152,61,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,49,36,0.35)',
  },
  sealText: {
    color: '#fdfcf8',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sealTextCompact: {
    fontSize: 15,
  },
  copy: {
    gap: 2,
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontFamily: typography.display,
    fontWeight: '700',
  },
  titleCompact: {
    fontSize: 15,
  },
  subtitle: {
    color: 'rgba(253,252,248,0.78)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  subtitleCompact: {
    fontSize: 10,
  },
});
