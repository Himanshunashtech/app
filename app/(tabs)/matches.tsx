import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Plus } from 'lucide-react-native';

import { addMyStatus, getStatuses, StatusItem } from '../lib/featureStore';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function StatusScreen() {
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    void getStatuses().then(setStatuses);
  }, []);

  const onPost = async () => {
    if (!draft.trim()) return;
    const next = await addMyStatus(draft.trim());
    setStatuses(next);
    setDraft('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Status</Text>
      </View>

      <View style={styles.composerCard}>
        <Text style={styles.composerLabel}>Share an update</Text>
        <View style={styles.composerRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            style={styles.input}
            placeholder="What's on your mind?"
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.postButton} onPress={onPost}>
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={statuses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.statusRow}>
            <View style={[styles.avatar, item.mine ? styles.mineAvatar : null]}>
              <Text style={styles.avatarText}>{item.name.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.message}>{item.text}</Text>
              <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 60 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontFamily: 'Inter-Bold', color: '#075E54' },
  composerCard: { marginHorizontal: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 12 },
  composerLabel: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#111827', marginBottom: 8 },
  composerRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, height: 42, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, fontFamily: 'Inter-Regular' },
  postButton: { width: 42, height: 42, marginLeft: 8, borderRadius: 10, backgroundColor: '#128C7E', alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 20, paddingVertical: 12 },
  statusRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },
  mineAvatar: { backgroundColor: '#075E54' },
  avatarText: { color: '#FFFFFF', fontFamily: 'Inter-Bold' },
  statusContent: { marginLeft: 12, flex: 1 },
  name: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: '#111827' },
  message: { marginTop: 2, fontSize: 14, fontFamily: 'Inter-Regular', color: '#374151' },
  time: { marginTop: 4, fontSize: 12, color: '#6B7280', fontFamily: 'Inter-Regular' },
});
