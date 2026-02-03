import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Plus, Circle } from 'lucide-react-native';

const statusUpdates = [
  {
    id: '1',
    name: 'Emma',
    time: 'Today, 08:20',
    accent: '#34B7F1',
  },
  {
    id: '2',
    name: 'Leo',
    time: 'Today, 07:05',
    accent: '#25D366',
  },
  {
    id: '3',
    name: 'Nina',
    time: 'Yesterday, 22:15',
    accent: '#128C7E',
  },
];

export default function StatusScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Status</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Plus size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Status</Text>
        <TouchableOpacity style={styles.statusRow}>
          <View style={styles.myStatusAvatar}>
            <Circle size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.statusName}>Tap to add status update</Text>
            <Text style={styles.statusTime}>Share photos, videos, or text</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Updates</Text>
        <FlatList
          data={statusUpdates}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.statusRow}>
              <View style={[styles.avatar, { borderColor: item.accent }]}>
                <Text style={styles.avatarText}>{item.name.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.statusName}>{item.name}</Text>
                <Text style={styles.statusTime}>{item.time}</Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
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
  section: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  myStatusAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#128C7E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  statusName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  statusTime: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
});
