import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';

import { getProfile, Profile, updateProfile } from '../lib/socialApi';

export default function SettingsScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void getProfile().then(setProfile);
  }, []);

  const onSave = async () => {
    if (!profile) return;
    const updated = await updateProfile({
      display_name: profile.display_name,
      about: profile.about,
      phone: profile.phone,
      notifications_enabled: profile.notifications_enabled,
      read_receipts_enabled: profile.read_receipts_enabled,
    });
    setProfile(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  if (!profile) return <ActivityIndicator style={{ marginTop: 80 }} color="#128C7E" />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.section}>
        <Text style={styles.label}>Display name</Text>
        <TextInput value={profile.display_name} onChangeText={(display_name) => setProfile({ ...profile, display_name })} style={styles.input} />
        <Text style={styles.label}>About</Text>
        <TextInput value={profile.about} onChangeText={(about) => setProfile({ ...profile, about })} style={styles.input} />
        <Text style={styles.label}>Phone</Text>
        <TextInput value={profile.phone} onChangeText={(phone) => setProfile({ ...profile, phone })} style={styles.input} keyboardType="phone-pad" />
      </View>

      <View style={styles.section}>
        <View style={styles.switchRow}><Text style={styles.switchLabel}>Notifications</Text><Switch value={profile.notifications_enabled} onValueChange={(notifications_enabled) => setProfile({ ...profile, notifications_enabled })} /></View>
        <View style={styles.switchRow}><Text style={styles.switchLabel}>Read receipts</Text><Switch value={profile.read_receipts_enabled} onValueChange={(read_receipts_enabled) => setProfile({ ...profile, read_receipts_enabled })} /></View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={onSave}><Text style={styles.saveButtonText}>{saved ? 'Saved' : 'Save changes'}</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24 },
  title: { fontFamily: 'Inter-Bold', fontSize: 24, color: '#075E54', marginBottom: 16 },
  section: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 14, marginBottom: 14 },
  label: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: '#374151', marginTop: 8 },
  input: { height: 42, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, fontFamily: 'Inter-Regular', marginTop: 6 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  switchLabel: { fontFamily: 'Inter-Medium', color: '#111827', fontSize: 15 },
  saveButton: { backgroundColor: '#128C7E', borderRadius: 12, alignItems: 'center', paddingVertical: 14 },
  saveButtonText: { color: '#FFFFFF', fontFamily: 'Inter-SemiBold', fontSize: 15 },
});
