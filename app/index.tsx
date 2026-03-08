import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, MessageCircle } from 'lucide-react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <MessageCircle size={64} color="#FFFFFF" />
      </View>
      <Text style={styles.title}>WhatsApp</Text>
      <Text style={styles.subtitle}>
        Simple, reliable, private messaging inspired by the original experience.
      </Text>

      <View style={styles.encryption}>
        <Lock size={16} color="#065F46" />
        <Text style={styles.encryptionText}>End-to-end encrypted chats and calls</Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.replace('/(tabs)')}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        By continuing, you agree to our Terms & Privacy Policy.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#075E54',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#D1FAE5',
    textAlign: 'center',
    lineHeight: 22,
  },
  encryption: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  encryptionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#065F46',
  },
  primaryButton: {
    marginTop: 32,
    backgroundColor: '#25D366',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 28,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 20,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#C7F9CC',
    textAlign: 'center',
  },
});
