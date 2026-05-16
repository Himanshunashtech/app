import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, UserPlus } from 'lucide-react-native';

import { Contact, createChat, fetchContacts } from './lib/chatApi';

export default function NewChatScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setContacts(await fetchContacts());
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filtered = useMemo(
    () => contacts.filter((contact) => `${contact.display_name} ${contact.phone}`.toLowerCase().includes(query.toLowerCase())),
    [contacts, query],
  );

  const startChat = async (contact: Contact) => {
    const chat = await createChat(contact);
    router.replace({ pathname: '/chat', params: { chatId: chat.id, name: chat.title } });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}><ArrowLeft size={22} color="#075E54" /></TouchableOpacity>
        <View><Text style={styles.title}>New chat</Text><Text style={styles.subtitle}>{contacts.length} contacts</Text></View>
      </View>

      <View style={styles.searchRow}>
        <Search size={18} color="#6B7280" />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search name or phone" placeholderTextColor="#9CA3AF" style={styles.searchInput} />
      </View>

      {loading ? <ActivityIndicator color="#128C7E" style={styles.loader} /> : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.contactRow} onPress={() => startChat(item)}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{item.display_name.slice(0, 2).toUpperCase()}</Text></View>
              <View style={styles.contactContent}>
                <Text style={styles.contactName}>{item.display_name}</Text>
                <Text style={styles.contactMeta}>{item.about} · {item.phone}</Text>
              </View>
              <UserPlus size={18} color="#128C7E" />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF3' },
  title: { fontFamily: 'Inter-Bold', color: '#075E54', fontSize: 24 },
  subtitle: { fontFamily: 'Inter-Regular', color: '#6B7280', fontSize: 13, marginTop: 2 },
  searchRow: { marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontFamily: 'Inter-Regular', color: '#111827' },
  loader: { marginTop: 24 },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366' },
  avatarText: { color: '#FFFFFF', fontFamily: 'Inter-Bold' },
  contactContent: { flex: 1, marginLeft: 12 },
  contactName: { fontFamily: 'Inter-SemiBold', color: '#111827', fontSize: 16 },
  contactMeta: { fontFamily: 'Inter-Regular', color: '#6B7280', fontSize: 13, marginTop: 3 },
});
