import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, shadow } from '../theme/tokens';

export default function GlassCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glass,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    padding: 20,
    overflow: 'hidden',
    ...shadow.card,
  },
});
