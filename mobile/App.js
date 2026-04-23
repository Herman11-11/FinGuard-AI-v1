import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import BottomTabs from './src/components/BottomTabs';
import OverviewScreen from './src/screens/OverviewScreen';
import VerifyScreen from './src/screens/VerifyScreen';
import QrScanScreen from './src/screens/QrScanScreen';
import LegacyScreen from './src/screens/LegacyScreen';
import AboutScreen from './src/screens/AboutScreen';
import { API_BASE_URL, apiUrl } from './src/config/api';
import { colors } from './src/theme/tokens';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStatus, setSystemStatus] = useState('checking');

  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(apiUrl('/api/health'));
      setSystemStatus(response.ok ? 'online' : 'offline');
    } catch (error) {
      setSystemStatus('offline');
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const screen = useMemo(() => {
    if (activeTab === 'verify') return <VerifyScreen />;
    if (activeTab === 'qr') return <QrScanScreen />;
    if (activeTab === 'legacy') return <LegacyScreen />;
    if (activeTab === 'about') return <AboutScreen />;
    return (
      <OverviewScreen
        systemStatus={systemStatus}
        apiBaseUrl={API_BASE_URL}
        onRefresh={checkHealth}
        onNavigate={setActiveTab}
      />
    );
  }, [activeTab, checkHealth, systemStatus]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />
      <StatusBar barStyle="dark-content" />
      <View style={styles.background}>
        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />
        <View style={styles.container}>{screen}</View>
      </View>
      <BottomTabs activeTab={activeTab} onChange={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  background: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  glowOne: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: 'rgba(51,138,101,0.08)',
    top: -100,
    left: -80,
  },
  glowTwo: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(198,152,61,0.08)',
    top: 90,
    right: -100,
  },
  container: {
    flex: 1,
  },
});
