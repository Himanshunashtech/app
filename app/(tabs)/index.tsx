import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { supabase } from '@/lib/supabase';
import { Heart, X, Star, MapPin, Briefcase, User, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FriendRequestModal from '@/components/FriendRequestModal';
import NotificationBanner from '@/components/NotificationBanner';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
}

export default function DiscoverScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [friendRequestModal, setFriendRequestModal] = useState<{
    visible: boolean;
    profile: Profile | null;
    likeId: string | null;
  }>({
    visible: false,
    profile: null,
    likeId: null,
  });
  const { user } = useAuth();
  const { notifications, dismissNotification } = useNotifications();

  useEffect(() => {
    fetchProfiles();
    subscribeToLikes();
  }, []);

  const subscribeToLikes = () => {
    if (!user) return;

    const channel = supabase
      .channel('incoming_likes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'likes',
          filter: `liked_id=eq.${user.id}`,
        },
        async (payload) => {
          const like = payload.new;
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', like.liker_id)
            .single();

          if (profile) {
            setFriendRequestModal({
              visible: true,
              profile,
              likeId: like.id,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchProfiles = async () => {
    if (!user) return;

    try {
      const { data: likedProfiles } = await supabase
        .from('likes')
        .select('liked_id')
        .eq('liker_id', user.id);

      const likedIds = likedProfiles?.map(like => like.liked_id) || [];
      
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id);

      if (likedIds.length > 0) {
        query = query.not('id', 'in', `(${likedIds.join(',')})`);
      }

      const { data: profiles, error } = await query.limit(10);

      if (error) throw error;

      setProfiles(profiles || []);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (isLike: boolean, isSuperLike: boolean = false) => {
    if (currentIndex >= profiles.length) return;

    const profile = profiles[currentIndex];
    
    if (isLike) {
      try {
        const { error } = await supabase
          .from('likes')
          .upsert([{
            liker_id: user?.id!,
            liked_id: profile.id,
            is_super_like: isSuperLike,
          }], {
            onConflict: 'liker_id,liked_id'
          });
          
        if (error) {
          console.error('Error sending like:', error);
          Alert.alert('Error', 'Failed to send like. Please try again.');
          return;
        }
      } catch (error: any) {
        console.error('Error sending like:', error.message);
        Alert.alert('Error', 'Failed to send like. Please try again.');
        return;
      }
    }

    setCurrentIndex(currentIndex + 1);
    setCurrentPhotoIndex(0);
  };

  const handleAcceptFriendRequest = async () => {
    if (!friendRequestModal.profile || !friendRequestModal.likeId) return;

    try {
      const { error } = await supabase
        .from('likes')
        .upsert([{
          liker_id: user?.id!,
          liked_id: friendRequestModal.profile.id,
          is_super_like: false,
        }], {
          onConflict: 'liker_id,liked_id'
        });

      if (error) {
        throw error;
      }

      setFriendRequestModal({ visible: false, profile: null, likeId: null });
    } catch (error: any) {
      console.error('Error accepting like:', error);
      Alert.alert('Error', error.message);
    }
  };

  const handleDeclineFriendRequest = () => {
    setFriendRequestModal({ visible: false, profile: null, likeId: null });
  };

  const nextPhoto = () => {
    const currentProfile = profiles[currentIndex];
    if (currentProfile && currentProfile.photos.length > 1) {
      setCurrentPhotoIndex((prev) => 
        prev < currentProfile.photos.length - 1 ? prev + 1 : 0
      );
    }
  };

  const prevPhoto = () => {
    const currentProfile = profiles[currentIndex];
    if (currentProfile && currentProfile.photos.length > 1) {
      setCurrentPhotoIndex((prev) => 
        prev > 0 ? prev - 1 : currentProfile.photos.length - 1
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Finding amazing people for you...</Text>
        </View>
      </View>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Heart size={64} color="#3B82F6" />
          <Text style={styles.emptyTitle}>No more profiles</Text>
          <Text style={styles.emptySubtitle}>Check back later for more matches!</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchProfiles}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <View style={styles.container}>
      {notifications.map((notification) => (
        <NotificationBanner
          key={notification.id}
          visible={true}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onDismiss={() => dismissNotification(notification.id)}
        />
      ))}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.photoContainer}>
            {currentProfile.photos && currentProfile.photos.length > 0 ? (
              <>
                <Image 
                  source={{ uri: currentProfile.photos[currentPhotoIndex] }} 
                  style={styles.profileImage}
                />
                {currentProfile.photos.length > 1 && (
                  <>
                    <TouchableOpacity style={styles.prevButton} onPress={prevPhoto}>
                      <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.nextButton} onPress={nextPhoto}>
                      <ChevronRight size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.photoIndicators}>
                      {currentProfile.photos.map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.indicator,
                            index === currentPhotoIndex && styles.activeIndicator
                          ]}
                        />
                      ))}
                    </View>
                  </>
                )}
              </>
            ) : (
              <View style={styles.noPhotoContainer}>
                <User size={80} color="#9CA3AF" />
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameSection}>
              <Text style={styles.profileName}>
                {currentProfile.first_name}, {currentProfile.age}
              </Text>
              <View style={styles.locationContainer}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.locationText}>{currentProfile.city}</Text>
              </View>
            </View>

            {currentProfile.job_title && (
              <View style={styles.jobContainer}>
                <Briefcase size={16} color="#6B7280" />
                <Text style={styles.jobText}>{currentProfile.job_title}</Text>
              </View>
            )}

            {currentProfile.bio && (
              <View style={styles.aboutSection}>
                <Text style={styles.aboutTitle}>About</Text>
                <Text style={styles.bioText}>{currentProfile.bio}</Text>
              </View>
            )}

            {currentProfile.interests.length > 0 && (
              <View style={styles.interestsSection}>
                <Text style={styles.interestsTitle}>Interests</Text>
                <View style={styles.interestsContainer}>
                  {currentProfile.interests.slice(0, 6).map((interest, index) => (
                    <View key={index} style={styles.interestTag}>
                      <Text style={styles.interestText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {currentProfile.education && (
              <View style={styles.educationSection}>
                <Text style={styles.educationTitle}>Education</Text>
                <Text style={styles.educationText}>{currentProfile.education}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={() => handleLike(false)}
        >
          <X size={28} color="#FF6B6B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.superLikeButton]}
          onPress={() => handleLike(true, true)}
        >
          <Star size={24} color="#3B82F6" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleLike(true)}
        >
          <Heart size={28} color="#4ADE80" />
        </TouchableOpacity>
      </View>

      <FriendRequestModal
        visible={friendRequestModal.visible}
        profile={friendRequestModal.profile}
        onAccept={handleAcceptFriendRequest}
        onDecline={handleDeclineFriendRequest}
        onClose={() => setFriendRequestModal({ visible: false, profile: null, likeId: null })}
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
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  photoContainer: {
    height: 400,
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  noPhotoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButton: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoIndicators: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
  },
  profileInfo: {
    padding: 24,
  },
  nameSection: {
    marginBottom: 16,
  },
  profileName: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  jobContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  jobText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  aboutSection: {
    marginBottom: 20,
  },
  aboutTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    lineHeight: 24,
  },
  interestsSection: {
    marginBottom: 20,
  },
  interestsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  interestText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
  },
  educationSection: {
    marginBottom: 20,
  },
  educationTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  educationText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 32,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  passButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  superLikeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#3B82F6',
  },
  likeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#4ADE80',
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
    textAlign: 'center',
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
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  refreshButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});