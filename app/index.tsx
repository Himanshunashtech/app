import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, MessageCircle, Phone, ShieldCheck } from 'lucide-react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.logo}><MessageCircle size={62} color="#FFFFFF" /></View>
      <Text style={styles.title}>WhatsApp Clone</Text>
      <Text style={styles.subtitle}>Realtime chat, status, calls, and profile controls backed by scalable services.</Text>

      <View style={styles.featureList}>
        <View style={styles.featureRow}><Lock size={16} color="#065F46" /><Text style={styles.featureText}>Secure encrypted messaging</Text></View>
        <View style={styles.featureRow}><Phone size={16} color="#065F46" /><Text style={styles.featureText}>Call logs and quick dial actions</Text></View>
        <View style={styles.featureRow}><ShieldCheck size={16} color="#065F46" /><Text style={styles.featureText}>Profile and privacy controls</Text></View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.primaryButtonText}>Open App</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#075E54', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  logo: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 30, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
  subtitle: { marginTop: 12, fontSize: 15, lineHeight: 22, textAlign: 'center', fontFamily: 'Inter-Regular', color: '#D1FAE5' },
  featureList: { marginTop: 20, backgroundColor: '#ECFDF3', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, width: '100%' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  featureText: { fontSize: 13, color: '#065F46', fontFamily: 'Inter-Medium' },
  primaryButton: { marginTop: 28, backgroundColor: '#25D366', paddingVertical: 14, paddingHorizontal: 36, borderRadius: 28 },
  primaryButtonText: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
});
