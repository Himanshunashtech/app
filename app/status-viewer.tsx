import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

export default function StatusViewerScreen() {
  const router = useRouter();
  const { name = 'Status', text = '', createdAt = '' } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <View style={styles.progress} />
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}><X size={24} color="#FFFFFF" /></TouchableOpacity>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{String(name).slice(0, 2).toUpperCase()}</Text></View>
        <View><Text style={styles.name}>{String(name)}</Text><Text style={styles.time}>{createdAt ? new Date(String(createdAt)).toLocaleString() : 'Now'}</Text></View>
      </View>
      <Text style={styles.statusText}>{String(text)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', paddingTop: 56, paddingHorizontal: 20 },
  progress: { position: 'absolute', top: 44, left: 20, right: 20, height: 3, borderRadius: 2, backgroundColor: '#25D366' },
  closeButton: { position: 'absolute', right: 18, top: 54, zIndex: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#128C7E' },
  avatarText: { fontFamily: 'Inter-Bold', color: '#FFFFFF' },
  name: { fontFamily: 'Inter-Bold', color: '#FFFFFF', fontSize: 16 },
  time: { fontFamily: 'Inter-Regular', color: '#D1D5DB', fontSize: 12, marginTop: 2 },
  statusText: { flex: 1, textAlign: 'center', textAlignVertical: 'center', color: '#FFFFFF', fontFamily: 'Inter-Bold', fontSize: 32, lineHeight: 40 },
});
