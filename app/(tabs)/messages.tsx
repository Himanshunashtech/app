import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Phone } from 'lucide-react-native';

const calls = [
  {
    id: '1',
    name: 'Ava Thompson',
    time: 'Today, 10:15',
    type: 'incoming',
  },
  {
    id: '2',
    name: 'Design Team',
    time: 'Today, 09:00',
    type: 'outgoing',
  },
  {
    id: '3',
    name: 'Dad',
    time: 'Yesterday, 21:42',
    type: 'missed',
  },
  {
    id: '4',
    name: 'Maya',
    time: 'Yesterday, 18:05',
    type: 'outgoing',
  },
];

const callIcon = (type: string) => {
  switch (type) {
    case 'incoming':
      return <PhoneIncoming size={18} color="#16A34A" />;
    case 'outgoing':
      return <PhoneOutgoing size={18} color="#2563EB" />;
    case 'missed':
      return <PhoneMissed size={18} color="#DC2626" />;
    default:
      return <Phone size={18} color="#6B7280" />;
  }
};

export default function CallsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calls</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Phone size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={calls}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.callRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.callContent}>
              <Text style={styles.callName}>{item.name}</Text>
              <View style={styles.callMeta}>
                {callIcon(item.type)}
                <Text style={styles.callTime}>{item.time}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#075E54',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  callContent: {
    marginLeft: 16,
    flex: 1,
  },
  callName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  callMeta: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callTime: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
});
