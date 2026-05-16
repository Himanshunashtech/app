import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Phone } from 'lucide-react-native';

import { Call, createCall, listCalls } from '../lib/socialApi';

function directionIcon(direction: string) {
  if (direction === 'incoming') return <PhoneIncoming size={16} color="#16A34A" />;
  if (direction === 'outgoing') return <PhoneOutgoing size={16} color="#2563EB" />;
  return <PhoneMissed size={16} color="#DC2626" />;
}

export default function CallsScreen() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setCalls(await listCalls());
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const topName = useMemo(() => calls[0]?.peer_name ?? 'Recent Contact', [calls]);

  const onQuickCall = async () => {
    const next = await createCall(topName);
    setCalls((prev) => [next, ...prev]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calls</Text>
        <TouchableOpacity style={styles.iconButton} onPress={onQuickCall}><Phone size={20} color="#FFFFFF" /></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 20 }} color="#128C7E" /> : (
        <FlatList
          data={calls}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.callRow}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{item.peer_name.slice(0, 2).toUpperCase()}</Text></View>
              <View style={styles.callContent}>
                <Text style={styles.callName}>{item.peer_name}</Text>
                <View style={styles.callMeta}>{directionIcon(item.direction)}<Text style={styles.callTime}>{new Date(item.created_at).toLocaleString()}</Text></View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 60 },
  header: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontFamily: 'Inter-Bold', color: '#075E54' },
  iconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#128C7E', alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 20 },
  callRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontFamily: 'Inter-Bold' },
  callContent: { marginLeft: 12, flex: 1 },
  callName: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#111827' },
  callMeta: { flexDirection: 'row', gap: 6, marginTop: 4, alignItems: 'center' },
  callTime: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#6B7280' },
});
