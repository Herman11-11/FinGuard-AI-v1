import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import GlassCard from '../components/GlassCard';
import OfficialMark from '../components/OfficialMark';
import { apiUrl } from '../config/api';
import { colors, typography } from '../theme/tokens';

export default function VerifyScreen() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState(null);
  const [error, setError] = useState('');

  const resultTone = useMemo(() => {
    if (!verification) return null;
    if (verification.is_authentic) {
      return {
        badge: 'Authentic',
        badgeStyle: styles.resultAuthentic,
        cardStyle: styles.resultCardAuthentic,
      };
    }
    if ((verification.confidence || 0) >= 0.5) {
      return {
        badge: 'Suspicious',
        badgeStyle: styles.resultSuspicious,
        cardStyle: styles.resultCardSuspicious,
      };
    }
    return {
      badge: 'Forged',
      badgeStyle: styles.resultForged,
      cardStyle: styles.resultCardForged,
    };
  }, [verification]);

  const setPickedFile = (file) => {
    setSelectedFile(file);
    setVerification(null);
    setError('');
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;
      setPickedFile(result.assets[0]);
    } catch (pickError) {
      console.error('Document pick failed:', pickError);
      setError('Could not open the document picker. Please try again.');
    }
  };

  const openCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError('Camera permission is required to capture a title deed.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setPickedFile({
        uri: asset.uri,
        name: asset.fileName || `capture-${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
        width: asset.width,
        height: asset.height,
      });
    } catch (cameraError) {
      console.error('Camera launch failed:', cameraError);
      setError('Could not open the camera. Please try again.');
    }
  };

  const verifyDocument = async () => {
    if (!selectedFile) {
      Alert.alert('No document selected', 'Choose or capture a document first.');
      return;
    }

    setVerifying(true);
    setError('');
    setVerification(null);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name || 'document',
        type: selectedFile.mimeType || guessMimeType(selectedFile.name),
      });

      const response = await fetch(apiUrl('/api/documents/verify'), {
        method: 'POST',
        body: formData,
      });

      const rawText = await response.text();
      let payload = null;

      try {
        payload = rawText ? JSON.parse(rawText) : null;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(payload?.detail || rawText || `Verification failed with status ${response.status}`);
      }

      setVerification(payload);
    } catch (requestError) {
      console.error('Verification failed:', requestError);
      setError(
        requestError?.message ||
          'Verification could not be completed. Check the backend connection and try again.'
      );
    } finally {
      setVerifying(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <OfficialMark compact />
        <Text style={styles.title}>Verify title deed</Text>
        <Text style={styles.subtitle}>
          Capture a deed with the camera or choose a file from the phone, then send it to the registry for verification.
        </Text>
      </View>

      <GlassCard>
        <Text style={styles.cardTitle}>Document input</Text>
        <Text style={styles.cardBody}>
          Use the camera for field verification or choose an image or PDF already on the device.
        </Text>

        <View style={styles.buttonGrid}>
          <Pressable style={styles.primaryButton} onPress={openCamera}>
            <Text style={styles.primaryButtonText}>Open camera</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={pickDocument}>
            <Text style={styles.secondaryButtonText}>Choose file</Text>
          </Pressable>
          <Pressable
            style={[styles.verifyButton, !selectedFile && styles.buttonDisabled]}
            onPress={verifyDocument}
            disabled={!selectedFile || verifying}
          >
            <Text style={[styles.verifyButtonText, (!selectedFile || verifying) && styles.disabledText]}>
              Verify now
            </Text>
          </Pressable>
        </View>

        {selectedFile ? (
          <View style={styles.previewWrap}>
            {isImageFile(selectedFile) ? (
              <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} />
            ) : (
              <View style={styles.pdfPreview}>
                <Text style={styles.pdfPreviewLabel}>PDF</Text>
              </View>
            )}
            <View style={styles.fileCard}>
              <Text style={styles.fileName}>{selectedFile.name}</Text>
              <Text style={styles.fileMeta}>
                {selectedFile.mimeType || guessMimeType(selectedFile.name)} • {formatBytes(selectedFile.size)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>No file selected yet.</Text>
          </View>
        )}

        {verifying ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.brand600} />
            <Text style={styles.loadingText}>Checking document with the registry...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </GlassCard>

      <GlassCard>
        <Text style={styles.cardTitle}>Verification result</Text>
        {verification ? (
          <View style={[styles.resultCard, resultTone?.cardStyle]}>
            <Text style={[styles.resultLabel, resultTone?.badgeStyle]}>{resultTone?.badge}</Text>
            <Text style={styles.resultHeadline}>{verification.details?.owner || 'Registry match unavailable'}</Text>
            <Text style={styles.resultMeta}>Confidence: {Math.round((verification.confidence || 0) * 100)}%</Text>
            <Text style={styles.resultMeta}>Basis: {humanizeBasis(verification.details?.verification_basis)}</Text>
            <Text style={styles.resultMeta}>Plot: {verification.details?.plot || 'Not available'}</Text>
            <Text style={styles.resultMeta}>Location: {verification.details?.location || 'Not available'}</Text>
            {verification.ai_verification?.available ? (
              <Text style={styles.resultMeta}>
                AI similarity: {Math.round((verification.ai_verification.similarity || 0) * 100)}%
              </Text>
            ) : null}
            {verification.has_steganography ? <Text style={styles.resultMeta}>Steganography payload detected</Text> : null}
            {verification.pdf_signature ? <Text style={styles.resultMeta}>PDF content signature evaluated</Text> : null}
          </View>
        ) : (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>
              Pick or capture a document and run verification to see the registry result here.
            </Text>
          </View>
        )}
      </GlassCard>
    </ScrollView>
  );
}

function guessMimeType(name = '') {
  const lower = (name || '').toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

function formatBytes(size) {
  if (typeof size !== 'number' || Number.isNaN(size)) return 'Unknown size';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function humanizeBasis(value) {
  if (!value) return 'Not available';
  if (value === 'pdf_signature') return 'PDF content signature';
  if (value === 'ai_support') return 'AI fingerprint support';
  return value.replace(/_/g, ' ');
}

function isImageFile(file) {
  const type = file?.mimeType || guessMimeType(file?.name);
  return type.startsWith('image/');
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
  buttonGrid: {
    gap: 10,
    marginTop: 18,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: colors.brand900,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  secondaryButtonText: {
    color: colors.brand900,
    fontWeight: '700',
  },
  verifyButton: {
    backgroundColor: colors.brand600,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: colors.white,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  disabledText: {
    color: colors.ink600,
  },
  previewWrap: {
    gap: 12,
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    backgroundColor: '#d8ddd9',
  },
  pdfPreview: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    backgroundColor: 'rgba(16,49,36,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  pdfPreviewLabel: {
    color: colors.brand900,
    fontFamily: typography.display,
    fontSize: 28,
    fontWeight: '700',
  },
  fileCard: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  fileName: {
    color: colors.ink900,
    fontWeight: '700',
    marginBottom: 4,
  },
  fileMeta: {
    color: colors.ink700,
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
  },
  resultCardAuthentic: {
    backgroundColor: colors.successBg,
  },
  resultCardSuspicious: {
    backgroundColor: colors.warningBg,
  },
  resultCardForged: {
    backgroundColor: colors.dangerBg,
  },
  resultLabel: {
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  resultAuthentic: {
    color: colors.successText,
  },
  resultSuspicious: {
    color: colors.warningText,
  },
  resultForged: {
    color: colors.dangerText,
  },
  resultHeadline: {
    color: colors.ink900,
    fontWeight: '700',
    fontSize: 18,
    marginTop: 4,
  },
  resultMeta: {
    color: colors.ink700,
    lineHeight: 20,
  },
});
