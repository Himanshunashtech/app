import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, SquarePen } from 'lucide-react-native';

import { ChatSummary, fetchChats } from '../lib/chatApi';

export default function ChatsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatSummary[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setChats(await fetchChats());
      } catch {
        setChats([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filtered = useMemo(
    () => chats.filter((chat) => chat.title.toLowerCase().includes(query.toLowerCase())),
    [chats, query],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Chats</Text>
          <Text style={styles.subtitle}>Realtime messaging</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Camera size={20} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <SquarePen size={20} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <TextInput
          placeholder="Search chats"
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator color="#128C7E" style={styles.loader} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatRow}
              onPress={() => router.push({ pathname: '/chat', params: { chatId: item.id, name: item.title } })}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.title.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatName}>{item.title}</Text>
                  <Text style={styles.chatTime}>{new Date(item.last_message_at).toLocaleTimeString()}</Text>
                </View>
                <View style={styles.chatFooter}>
                  <Text style={styles.chatMessage} numberOfLines={1}>{item.last_message}</Text>
                  {item.unread_count > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unread_count}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, fontFamily: 'Inter-Bold', color: '#075E54' },
  subtitle: { marginTop: 4, fontSize: 15, fontFamily: 'Inter-Medium', color: '#6B7280' },
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  searchWrapper: { paddingHorizontal: 20, paddingBottom: 12 },
  searchInput: { height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 16, fontFamily: 'Inter-Regular', color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  loader: { marginTop: 32 },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  chatRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366' },
  avatarText: { fontSize: 16, fontFamily: 'Inter-Bold', color: '#FFFFFF' },
  chatContent: { flex: 1, marginLeft: 16 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatName: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#111827' },
  chatTime: { fontSize: 12, fontFamily: 'Inter-Medium', color: '#9CA3AF' },
  chatFooter: { marginTop: 6, flexDirection: 'row', alignItems: 'center' },
  chatMessage: { flex: 1, fontSize: 14, color: '#4B5563', fontFamily: 'Inter-Regular' },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366', marginLeft: 10, paddingHorizontal: 6 },
  unreadText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Inter-SemiBold' },
});
