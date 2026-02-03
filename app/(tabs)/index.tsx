import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, SquarePen } from 'lucide-react-native';

const chats = [
  {
    id: '1',
    name: 'Ava Thompson',
    message: 'Landing at 7:45. See you soon!',
    time: '09:24',
    unread: 2,
    accent: '#25D366',
  },
  {
    id: '2',
    name: 'Design Team',
    message: 'Marco: Updated the voice note flow.',
    time: '08:57',
    unread: 0,
    accent: '#128C7E',
  },
  {
    id: '3',
    name: 'Dad',
    message: 'Call me when you are free.',
    time: 'Yesterday',
    unread: 1,
    accent: '#34B7F1',
  },
  {
    id: '4',
    name: 'Travel Squad',
    message: 'Tickets booked! 🎉',
    time: 'Yesterday',
    unread: 0,
    accent: '#075E54',
  },
  {
    id: '5',
    name: 'Maya',
    message: 'That sunset view was unreal.',
    time: 'Mon',
    unread: 0,
    accent: '#0F9D58',
  },
];

export default function ChatsScreen() {
  const router = useRouter();

  const renderChat = ({ item }: { item: typeof chats[number] }) => (
    <TouchableOpacity
      style={styles.chatRow}
      onPress={() =>
        router.push({
          pathname: '/chat',
          params: { name: item.name, status: 'online' },
        })
      }
    >
      <View style={[styles.avatar, { backgroundColor: item.accent }]}>
        <Text style={styles.avatarText}>
          {item.name
            .split(' ')
            .map((part) => part[0])
            .slice(0, 2)
            .join('')}
        </Text>
      </View>
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        <View style={styles.chatFooter}>
          <Text style={styles.chatMessage} numberOfLines={1}>
            {item.message}
          </Text>
          {item.unread > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unread}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>WhatsApp</Text>
          <Text style={styles.subtitle}>Chats</Text>
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
          placeholder="Search or start new chat"
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChat}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#075E54',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchInput: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontFamily: 'Inter-Regular',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  chatContent: {
    flex: 1,
    marginLeft: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  chatTime: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  chatFooter: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatMessage: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginRight: 12,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
});
