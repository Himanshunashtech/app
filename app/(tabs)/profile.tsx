import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { User, CreditCard as Edit, Camera, LogOut, MapPin, Briefcase, Heart } from 'lucide-react-native';
import PhotoUpload from '@/components/PhotoUpload';
import SignOutModal from '@/components/SignOutModal';

interface Profile {
  id: string;
  first_name: string;
  age: number;
  city: string;
  bio: string;
  interests: string[];
  photos: string[];
  job_title: string;
  education: string;
  looking_for: string;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile(profileData);
      setEditData(profileData);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(editData)
        .eq('id', user.id);

      if (error) throw error;

      setProfile({ ...profile, ...editData });
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth?mode=signin');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setShowSignOutModal(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Profile not found</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchProfile}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerButtons}>
          {editing ? (
            <>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setEditing(false)}
              >
                <Text style={styles.headerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setEditing(true)}
            >
              <Edit size={20} color="#3B82F6" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {profile.photos && profile.photos.length > 0 ? (
              <Image 
                source={{ uri: profile.photos[0] }} 
                style={styles.avatar}
              />
            ) : (
              <User size={48} color="#3B82F6" />
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile.first_name}, {profile.age}
            </Text>
            <View style={styles.profileDetails}>
              <View style={styles.detailItem}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.detailText}>{profile.city}</Text>
              </View>
              {profile.job_title && (
                <View style={styles.detailItem}>
                  <Briefcase size={16} color="#6B7280" />
                  <Text style={styles.detailText}>{profile.job_title}</Text>
                </View>
              )}
              <View style={styles.detailItem}>
                <Heart size={16} color="#6B7280" />
                <Text style={styles.detailText}>{profile.looking_for}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          {editing ? (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editData.bio || ''}
              onChangeText={(text) => setEditData({ ...editData, bio: text })}
              placeholder="Tell us about yourself..."
              multiline
              numberOfLines={4}
            />
          ) : (
            <Text style={styles.bioText}>
              {profile.bio || 'No bio yet. Edit your profile to add one!'}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          {editing ? (
            <PhotoUpload
              photos={editData.photos || []}
              onPhotosChange={(photos) => setEditData({ ...editData, photos })}
              maxPhotos={3}
            />
          ) : (
            <View style={styles.photosContainer}>
              {profile.photos && profile.photos.length > 0 ? (
                profile.photos.map((photo, index) => (
                  <Image key={index} source={{ uri: photo }} style={styles.profilePhoto} />
                ))
              ) : (
                <Text style={styles.noPhotosText}>No photos added yet</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestsContainer}>
            {profile.interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>First Name</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={editData.first_name || ''}
                  onChangeText={(text) => setEditData({ ...editData, first_name: text })}
                />
              ) : (
                <Text style={styles.detailValue}>{profile.first_name}</Text>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Age</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={editData.age?.toString() || ''}
                  onChangeText={(text) => setEditData({ ...editData, age: parseInt(text) || 0 })}
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.detailValue}>{profile.age}</Text>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>City</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={editData.city || ''}
                  onChangeText={(text) => setEditData({ ...editData, city: text })}
                />
              ) : (
                <Text style={styles.detailValue}>{profile.city}</Text>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Job Title</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={editData.job_title || ''}
                  onChangeText={(text) => setEditData({ ...editData, job_title: text })}
                />
              ) : (
                <Text style={styles.detailValue}>{profile.job_title || 'Not specified'}</Text>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Education</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={editData.education || ''}
                  onChangeText={(text) => setEditData({ ...editData, education: text })}
                />
              ) : (
                <Text style={styles.detailValue}>{profile.education || 'Not specified'}</Text>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={() => setShowSignOutModal(true)}
        >
          <LogOut size={20} color="#FFFFFF" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        visible={showSignOutModal}
        onConfirm={handleSignOut}
        onCancel={() => setShowSignOutModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  profileDetails: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 24,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  interestText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    flex: 1,
    textAlign: 'right',
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 40,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  refreshButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  noPhotosText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});