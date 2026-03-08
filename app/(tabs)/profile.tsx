import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Bell, ShieldCheck, Smartphone, HelpCircle, LogOut } from 'lucide-react-native';

const settings = [
  {
    id: '1',
    title: 'Account',
    subtitle: 'Privacy, security, change number',
    icon: ShieldCheck,
  },
  {
    id: '2',
    title: 'Notifications',
    subtitle: 'Message, group & call tones',
    icon: Bell,
  },
  {
    id: '3',
    title: 'Devices',
    subtitle: 'Linked devices, desktop',
    icon: Smartphone,
  },
  {
    id: '4',
    title: 'Help',
    subtitle: 'Help center, contact us',
    icon: HelpCircle,
  },
];

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>JT</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Jordan Taylor</Text>
          <Text style={styles.profileStatus}>Busy · Available on mobile</Text>
        </View>
      </View>

      <View style={styles.section}>
        {settings.map((item) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity key={item.id} style={styles.settingRow}>
              <View style={styles.iconCircle}>
                <Icon size={18} color="#075E54" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.logoutRow}>
        <LogOut size={18} color="#DC2626" />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#075E54',
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  profileStatus: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingContent: {
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  settingSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#DC2626',
  },
});
