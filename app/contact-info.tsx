import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Bell, Lock, Phone, Search, Video } from 'lucide-react-native';

export default function ContactInfoScreen() {
  const router = useRouter();
  const { name = 'Contact', status = 'Available', chatId = '' } = useLocalSearchParams();
  const displayName = String(name);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><ArrowLeft size={22} color="#FFFFFF" /></TouchableOpacity>
      <View style={styles.hero}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{displayName.slice(0, 2).toUpperCase()}</Text></View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.status}>{String(status)}</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.action} onPress={() => router.push({ pathname: '/call-screen', params: { name: displayName, mode: 'audio' } })}><Phone size={20} color="#128C7E" /><Text style={styles.actionText}>Audio</Text></TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={() => router.push({ pathname: '/call-screen', params: { name: displayName, mode: 'video' } })}><Video size={20} color="#128C7E" /><Text style={styles.actionText}>Video</Text></TouchableOpacity>
        <TouchableOpacity style={styles.action}><Search size={20} color="#128C7E" /><Text style={styles.actionText}>Search</Text></TouchableOpacity>
      </View>
      <View style={styles.card}>
        <View style={styles.row}><Lock size={18} color="#075E54" /><Text style={styles.rowText}>Messages and calls are protected in transit.</Text></View>
        <View style={styles.row}><Bell size={18} color="#075E54" /><Text style={styles.rowText}>Custom notifications enabled for this conversation.</Text></View>
      </View>
      <TouchableOpacity style={styles.chatButton} onPress={() => router.push({ pathname: '/chat', params: { chatId: String(chatId), name: displayName } })}><Text style={styles.chatButtonText}>Open chat</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  backButton: { position: 'absolute', left: 16, top: 56, zIndex: 2, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.18)' },
  hero: { backgroundColor: '#075E54', alignItems: 'center', paddingTop: 92, paddingBottom: 28 },
  avatar: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366', marginBottom: 12 },
  avatarText: { fontFamily: 'Inter-Bold', color: '#FFFFFF', fontSize: 28 },
  name: { fontFamily: 'Inter-Bold', color: '#FFFFFF', fontSize: 24 },
  status: { fontFamily: 'Inter-Regular', color: '#D1FAE5', marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 12, padding: 16 },
  action: { flex: 1, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  actionText: { marginTop: 6, fontFamily: 'Inter-SemiBold', color: '#128C7E', fontSize: 12 },
  card: { marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 8 },
  rowText: { flex: 1, fontFamily: 'Inter-Regular', color: '#374151', lineHeight: 20 },
  chatButton: { margin: 16, backgroundColor: '#128C7E', borderRadius: 14, alignItems: 'center', paddingVertical: 14 },
  chatButtonText: { color: '#FFFFFF', fontFamily: 'Inter-Bold' },
});
