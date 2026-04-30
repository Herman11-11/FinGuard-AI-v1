import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import GlassCard from '../components/GlassCard';
import OfficialMark from '../components/OfficialMark';
import { api } from '../config/api';
import { colors, typography } from '../theme/tokens';

const initialForm = {
  owner: '',
  plot_number: '',
  location: '',
  area: '',
  region: '',
  district: '',
};

export default function LegacyScreen() {
  const [form, setForm] = useState(initialForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setPickedFile = (file) => {
    setSelectedFile(file);
    setResult(null);
    setError('');
  };

  const openCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError('Camera permission is required to capture a legacy deed.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      setPickedFile({
        uri: asset.uri,
        name: asset.fileName || `legacy-${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
      });
    } catch (cameraError) {
      console.error('Legacy camera launch failed:', cameraError);
      setError('Could not open the camera. Please try again.');
    }
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
      console.error('Legacy document pick failed:', pickError);
      setError('Could not open the document picker. Please try again.');
    }
  };

  const submitLegacyCapture = async () => {
    if (!selectedFile) {
      Alert.alert('Missing deed image', 'Capture or choose the legacy title deed first.');
      return;
    }

    const missingField = Object.entries(form).find(([, value]) => !String(value).trim());
    if (missingField) {
      Alert.alert('Missing details', `Please fill in ${missingField[0].replace('_', ' ')}.`);
      return;
    }

    setSubmitting(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedFile.uri,
        name: selectedFile.name || 'legacy-document',
        type: selectedFile.mimeType || guessMimeType(selectedFile.name),
      });

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await api.post('/api/documents/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Finguard-Compact': '1',
        },
      });

      setResult(response.data);
    } catch (submitError) {
      console.error('Legacy submission failed:', submitError);
      setError(
        submitError?.response?.data?.detail ||
          submitError?.message ||
          'Legacy capture could not be submitted. Check the backend connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <OfficialMark compact />
        <Text style={styles.title}>Legacy title capture</Text>
        <Text style={styles.subtitle}>
          Enroll older title deeds into the secured registry with guided metadata entry and secure upload.
        </Text>
      </View>

      <GlassCard>
        <Text style={styles.cardTitle}>Capture legacy deed</Text>
        <Text style={styles.cardBody}>
          Start with a clean image or PDF of the old title deed. Camera capture is best for field enrollment.
        </Text>

        <View style={styles.buttonRow}>
          <Pressable style={styles.primaryButton} onPress={openCamera}>
            <Text style={styles.primaryButtonText}>Open camera</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={pickDocument}>
            <Text style={styles.secondaryButtonText}>Choose file</Text>
          </Pressable>
        </View>

        {selectedFile ? (
          <View style={styles.previewWrap}>
            {isImageFile(selectedFile) ? (
              <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} />
            ) : (
              <View style={styles.pdfPreview}><Text style={styles.pdfPreviewLabel}>PDF</Text></View>
            )}
            <View style={styles.fileCard}>
              <Text style={styles.fileName}>{selectedFile.name}</Text>
              <Text style={styles.fileMeta}>{selectedFile.mimeType || guessMimeType(selectedFile.name)} • {formatBytes(selectedFile.size)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>No legacy deed file selected yet.</Text>
          </View>
        )}
      </GlassCard>

      <GlassCard>
        <Text style={styles.cardTitle}>Registry details</Text>
        <View style={styles.formGrid}>
          <Field label="Owner" value={form.owner} onChangeText={(value) => setField('owner', value)} placeholder="Full owner name" />
          <Field label="Plot number" value={form.plot_number} onChangeText={(value) => setField('plot_number', value)} placeholder="Plot or title number" />
          <Field label="Location" value={form.location} onChangeText={(value) => setField('location', value)} placeholder="Ward / street / village" />
          <Field label="Area" value={form.area} onChangeText={(value) => setField('area', value)} placeholder="Area in square metres" keyboardType="numeric" />
          <Field label="Region" value={form.region} onChangeText={(value) => setField('region', value)} placeholder="Region" />
          <Field label="District" value={form.district} onChangeText={(value) => setField('district', value)} placeholder="District" />
        </View>

        <Pressable style={[styles.submitButton, submitting && styles.buttonDisabled]} onPress={submitLegacyCapture} disabled={submitting}>
          <Text style={styles.submitButtonText}>Submit legacy capture</Text>
        </Pressable>

        {submitting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.brand600} />
            <Text style={styles.loadingText}>Registering legacy record...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </GlassCard>

      <GlassCard>
        <Text style={styles.cardTitle}>Enrollment result</Text>
        {result ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Submitted</Text>
            <Text style={styles.resultHeadline}>{result.record_id || 'Legacy record created'}</Text>
            <Text style={styles.resultMeta}>Fingerprint: {result.fingerprint ? `${result.fingerprint.slice(0, 18)}...` : 'Generated'}</Text>
            <Text style={styles.resultMeta}>AI signature: {result.ai_signature ? `${result.ai_signature.slice(0, 18)}...` : 'Not available'}</Text>
            <Text style={styles.resultMeta}>{result.message || 'Legacy deed registered successfully.'}</Text>
            {result.mini_qr ? (
              <View style={styles.qrWrap}>
                <Image
                  source={{ uri: `data:image/png;base64,${result.mini_qr}` }}
                  style={styles.qrImage}
                />
                <Text style={styles.qrText}>Use this QR for future field verification.</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderText}>Once submitted, the new record ID and trust markers will appear here.</Text>
          </View>
        )}
      </GlassCard>
    </ScrollView>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.ink600}
        style={styles.input}
      />
    </View>
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
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 16,
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
  formGrid: {
    gap: 14,
    marginTop: 8,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.ink700,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.68)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.ink900,
  },
  submitButton: {
    marginTop: 18,
    backgroundColor: colors.brand600,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.white,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.5,
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
  qrWrap: {
    marginTop: 12,
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
  },
  qrImage: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },
  qrText: {
    color: colors.ink700,
    fontWeight: '700',
    textAlign: 'center',
  },
});
