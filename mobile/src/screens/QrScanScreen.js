import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import GlassCard from '../components/GlassCard';
import OfficialMark from '../components/OfficialMark';
import { api } from '../config/api';
import { colors, typography } from '../theme/tokens';

export default function QrScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedPayload, setScannedPayload] = useState('');
  const [lookup, setLookup] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState('');
  const [scanEnabled, setScanEnabled] = useState(true);

  const extractedRecordId = useMemo(() => extractRecordId(scannedPayload), [scannedPayload]);

  const handleBarCodeScanned = ({ data }) => {
    if (!scanEnabled) return;
    setScanEnabled(false);
    setScannedPayload(data || '');
    setLookup(null);
    setError('');
  };

  const handleLookup = async () => {
    if (!extractedRecordId) {
      Alert.alert('No record ID found', 'Scan a QR code that contains a record ID first.');
      return;
    }

    setLookingUp(true);
    setError('');
    setLookup(null);

    try {
      const plotOrRecordId = extractedRecordId.replace(/^LAND-/, '');
      const response = await api.get(`/api/documents/search/${plotOrRecordId}`);
      setLookup(response.data);
    } catch (lookupError) {
      console.error('QR lookup failed:', lookupError);
      setError(lookupError?.response?.data?.detail || 'Could not find that record in the registry.');
    } finally {
      setLookingUp(false);
    }
  };

  const resetScan = () => {
    setScannedPayload('');
    setLookup(null);
    setError('');
    setScanEnabled(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <OfficialMark compact />
        <Text style={styles.title}>Scan QR</Text>
        <Text style={styles.subtitle}>
          Scan a QR code from the deed and turn it into a quick registry lookup on mobile.
        </Text>
      </View>

      {!permission ? (
        <GlassCard>
          <Text style={styles.cardTitle}>Camera permission</Text>
          <Text style={styles.cardBody}>Checking camera permission...</Text>
        </GlassCard>
      ) : !permission.granted ? (
        <GlassCard>
          <Text style={styles.cardTitle}>Camera permission</Text>
          <Text style={styles.cardBody}>Allow camera access so the phone can scan the deed QR code.</Text>
          <Pressable style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Grant permission</Text>
          </Pressable>
        </GlassCard>
      ) : (
        <GlassCard>
          <Text style={styles.cardTitle}>Scanner</Text>
          <View style={styles.scannerShell}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
            <View pointerEvents="none" style={styles.scannerOverlay}>
              <View style={styles.scannerFrame} />
            </View>
          </View>
          <Text style={styles.cardBody}>
            {scanEnabled ? 'Point the camera at a deed QR code.' : 'QR captured. Review it below or scan again.'}
          </Text>
        </GlassCard>
      )}

      <GlassCard>
        <Text style={styles.cardTitle}>Scanned content</Text>
        {scannedPayload ? (
          <View style={styles.payloadCard}>
            <Text style={styles.payloadText}>{scannedPayload}</Text>
            <Text style={styles.payloadMeta}>Record ID: {extractedRecordId || 'Not detected'}</Text>
          </View>
        ) : (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>No QR data captured yet.</Text>
          </View>
        )}
        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.primaryButton, !extractedRecordId && styles.buttonDisabled]}
            onPress={handleLookup}
            disabled={!extractedRecordId || lookingUp}
          >
            <Text style={[styles.primaryButtonText, !extractedRecordId && styles.disabledText]}>Lookup record</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={resetScan}>
            <Text style={styles.secondaryButtonText}>Scan again</Text>
          </Pressable>
        </View>
        {lookingUp ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.brand600} />
            <Text style={styles.loadingText}>Checking registry...</Text>
          </View>
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </GlassCard>

      <GlassCard>
        <Text style={styles.cardTitle}>Lookup result</Text>
        {lookup ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Registry match</Text>
            <Text style={styles.resultHeadline}>{lookup.owner || 'Owner unavailable'}</Text>
            <Text style={styles.resultMeta}>Record ID: {lookup.record_id || extractedRecordId}</Text>
            <Text style={styles.resultMeta}>Plot: {lookup.plot || 'Not available'}</Text>
            <Text style={styles.resultMeta}>Location: {lookup.location || 'Not available'}</Text>
            <Text style={styles.resultMeta}>Region: {lookup.region || 'Not available'}</Text>
          </View>
        ) : (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>Scan a code and run a lookup to see the official record here.</Text>
          </View>
        )}
      </GlassCard>
    </ScrollView>
  );
}

function extractRecordId(text) {
  if (!text) return '';
  const recordMatch = text.match(/LAND-[A-Z0-9-]+/i);
  if (recordMatch) return recordMatch[0].toUpperCase();

  const idLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^record id\s*:/i.test(line));
  if (idLine) {
    const [, value] = idLine.split(':');
    return (value || '').trim().toUpperCase();
  }

  return '';
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
    marginTop: 12,
  },
  scannerShell: {
    height: 280,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#d9ddd9',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 210,
    height: 210,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.92)',
    backgroundColor: 'transparent',
  },
  payloadCard: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    gap: 8,
  },
  payloadText: {
    color: colors.ink900,
    lineHeight: 20,
  },
  payloadMeta: {
    color: colors.ink700,
    fontWeight: '700',
  },
  placeholderCard: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(16,24,40,0.16)',
  },
  placeholderText: {
    color: colors.ink600,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: colors.brand900,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
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
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  secondaryButtonText: {
    color: colors.brand900,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  disabledText: {
    color: colors.ink600,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  loadingText: {
    color: colors.ink700,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 14,
    color: colors.dangerText,
    backgroundColor: colors.dangerBg,
    padding: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  resultCard: {
    marginTop: 8,
    borderRadius: 20,
    padding: 16,
    gap: 6,
    backgroundColor: colors.successBg,
  },
  resultLabel: {
    color: colors.successText,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
  },
  resultHeadline: {
    color: colors.ink900,
    fontWeight: '700',
    fontSize: 18,
  },
  resultMeta: {
    color: colors.ink700,
    lineHeight: 20,
  },
});
