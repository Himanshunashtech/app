import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Phone, Video, Lock, Send } from 'lucide-react-native';

import { ChatMessage, currentUserId, fetchMessages, sendMessage } from './lib/chatApi';

export default function ChatScreen() {
  const { chatId = '', name = 'Contact', status = 'online' } = useLocalSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!chatId) return;
      try {
        setMessages(await fetchMessages(String(chatId)));
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [chatId]);

  const userId = useMemo(() => currentUserId(), []);

  const onSend = async () => {
    if (!message.trim() || !chatId) return;
    const pending = message.trim();
    setMessage('');
    try {
      const created = await sendMessage(String(chatId), pending);
      setMessages((prev) => [...prev, created]);
    } catch {
      setMessage(pending);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{String(name)}</Text>
          <Text style={styles.headerStatus}>{String(status)}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}><Video size={18} color="#FFFFFF" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}><Phone size={18} color="#FFFFFF" /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.encryptionBanner}>
        <Lock size={14} color="#075E54" />
        <Text style={styles.encryptionText}>End-to-end encryption in transit and at rest</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#128C7E" style={styles.loader} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <View style={[styles.messageBubble, item.sender_id === userId ? styles.myBubble : styles.theirBubble]}>
              <Text style={styles.messageText}>{item.text}</Text>
              <Text style={styles.messageTime}>{new Date(item.created_at).toLocaleTimeString()}</Text>
            </View>
          )}
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Message"
          placeholderTextColor="#9CA3AF"
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={onSend}>
          <Send size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECE5DD' },
  header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#075E54', flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1, marginLeft: 12 },
  headerName: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
  headerStatus: { marginTop: 2, fontSize: 12, fontFamily: 'Inter-Regular', color: '#D1FAE5' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  encryptionBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#DCFCE7', paddingVertical: 8 },
  encryptionText: { fontSize: 12, fontFamily: 'Inter-Medium', color: '#065F46' },
  loader: { marginTop: 32 },
  messageList: { paddingHorizontal: 16, paddingVertical: 20, gap: 12 },
  messageBubble: { maxWidth: '78%', padding: 12, borderRadius: 16, shadowColor: '#000000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#DCF8C6' },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF' },
  messageText: { fontSize: 15, fontFamily: 'Inter-Regular', color: '#111827' },
  messageTime: { marginTop: 6, fontSize: 11, fontFamily: 'Inter-Medium', color: '#6B7280', textAlign: 'right' },
  inputBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  input: { flex: 1, height: 44, backgroundColor: '#FFFFFF', borderRadius: 22, paddingHorizontal: 16, fontFamily: 'Inter-Regular', color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
});
