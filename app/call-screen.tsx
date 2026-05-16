import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Mic, MicOff, PhoneOff, Video, VideoOff, Volume2 } from 'lucide-react-native';

export default function CallScreen() {
  const router = useRouter();
  const { name = 'Contact', mode = 'audio' } = useLocalSearchParams();
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(mode === 'video');
  const displayName = String(name);
  const callMode = useMemo(() => (cameraEnabled ? 'Video call' : 'Voice call'), [cameraEnabled]);

  return (
    <View style={styles.container}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{displayName.slice(0, 2).toUpperCase()}</Text></View>
      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.status}>{callMode} · ringing</Text>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.control} onPress={() => setMuted((value) => !value)}>{muted ? <MicOff size={24} color="#FFFFFF" /> : <Mic size={24} color="#FFFFFF" />}</TouchableOpacity>
        <TouchableOpacity style={styles.control}><Volume2 size={24} color="#FFFFFF" /></TouchableOpacity>
        <TouchableOpacity style={styles.control} onPress={() => setCameraEnabled((value) => !value)}>{cameraEnabled ? <Video size={24} color="#FFFFFF" /> : <VideoOff size={24} color="#FFFFFF" />}</TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.endButton} onPress={() => router.back()}><PhoneOff size={28} color="#FFFFFF" /></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#075E54', alignItems: 'center', justifyContent: 'center', padding: 24 },
  avatar: { width: 118, height: 118, borderRadius: 59, alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366', marginBottom: 18 },
  avatarText: { fontFamily: 'Inter-Bold', color: '#FFFFFF', fontSize: 34 },
  name: { fontFamily: 'Inter-Bold', color: '#FFFFFF', fontSize: 28 },
  status: { fontFamily: 'Inter-Regular', color: '#D1FAE5', marginTop: 8 },
  controls: { flexDirection: 'row', gap: 20, marginTop: 80 },
  control: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  endButton: { marginTop: 44, width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DC2626' },
});
