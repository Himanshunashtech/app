import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, User, Bell, Check, X } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

interface Like {
  id: string;
  liker_id: string;
  liked_id: string;
  is_super_like: boolean;
  created_at: string;
  profile: {
    id: string;
    first_name: string;
    age: number;
    city: string;
    photos: string[];
    bio: string;
    interests: string[];
    job_title: string;
    education: string;
  };
}

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  profile: {
    id: string;
    first_name: string;
    age: number;
    city: string;
    photos: string[];
    bio: string;
    interests: string[];
  };
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unreadCount?: number;
}

export default function MatchesScreen() {
  const [activeTab, setActiveTab] = useState<'likes' | 'matches'>('likes');
  const [pendingLikes, setPendingLikes] = useState<Like[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<Like | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchPendingLikes();
    fetchMatches();
    subscribeToRealTimeUpdates();
  }, []);

  const subscribeToRealTimeUpdates = () => {
    if (!user) return;

    // Subscribe to likes
    const likesChannel = supabase
      .channel('likes_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
        },
        () => {
          fetchPendingLikes();
        }
      )
      .subscribe();

    // Subscribe to matches
    const matchesChannel = supabase
      .channel('matches_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        () => {
          fetchMatches();
          fetchPendingLikes();
        }
      )
      .subscribe();

    // Subscribe to messages for unread counts
    const messagesChannel = supabase
      .channel('messages_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchMatches(); // Refresh to update last messages and unread counts
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(messagesChannel);
    };
  };

  const fetchPendingLikes = async () => {
    if (!user) return;

    try {
      const { data: likesData, error } = await supabase
        .from('likes')
        .select(`
          *,
          profile:profiles!likes_liker_id_fkey(*)
        `)
        .eq('liked_id', user.id);

      if (error) throw error;

      // Filter out likes that already have matches
      const { data: matchesData } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      const matchedUserIds = new Set();
      matchesData?.forEach(match => {
        matchedUserIds.add(match.user1_id === user.id ? match.user2_id : match.user1_id);
      });

      const pendingLikes = likesData?.filter(like => 
        !matchedUserIds.has(like.liker_id)
      ) || [];

      setPendingLikes(pendingLikes);
      setNotificationCount(pendingLikes.length);
    } catch (error: any) {
      console.error('Error fetching pending likes:', error.message);
    }
  };

  const fetchMatches = async () => {
    if (!user) return;

    try {
      const { data: matchData, error } = await supabase
        .from('matches')
        .select(`
          *,
          profile1:profiles!matches_user1_id_fkey(*),
          profile2:profiles!matches_user2_id_fkey(*)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get last messages and unread counts for each match
      const matchesWithMessages = await Promise.all(
        (matchData || []).map(async (match) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('match_id', match.id)
            .neq('sender_id', user.id)
            .is('read_at', null);

          return {
            ...match,
            profile: match.user1_id === user.id ? match.profile2 : match.profile1,
            lastMessage: lastMessage || undefined,
            unreadCount: unreadCount || 0,
          };
        })
      );

      setMatches(matchesWithMessages);
    } catch (error: any) {
      console.error('Error fetching matches:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeProfile = (like: Like) => {
    setSelectedProfile(like);
    setShowProfileModal(true);
  };

  const handleAcceptLike = async () => {
    if (!selectedProfile) return;

    try {
      const { error } = await supabase
        .from('likes')
        .upsert([{
          liker_id: user?.id!,
          liked_id: selectedProfile.liker_id,
          is_super_like: false,
        }], {
          onConflict: 'liker_id,liked_id'
        });

      if (error) throw error;

      setShowProfileModal(false);
      setSelectedProfile(null);
      setActiveTab('matches'); // Switch to matches tab
    } catch (error: any) {
      console.error('Error accepting like:', error);
      Alert.alert('Error', error.message);
    }
  };

  const handlePassLike = async () => {
    if (!selectedProfile) return;

    try {
      await supabase
        .from('likes')
        .delete()
        .eq('id', selectedProfile.id);

      setShowProfileModal(false);
      setSelectedProfile(null);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleChatPress = (matchId: string, profileName: string) => {
    router.push({
      pathname: '/chat',
      params: { matchId, profileName },
    });
  };

  const handleNotificationPress = () => {
    router.push('/notifications');
  };

  const renderLikeCard = ({ item }: { item: Like }) => (
    <TouchableOpacity
      style={styles.gridCard}
      onPress={() => handleLikeProfile(item)}
    >
      <View style={styles.cardImageContainer}>
        {item.profile.photos && item.profile.photos.length > 0 ? (
          <Image source={{ uri: item.profile.photos[0] }} style={styles.cardImage} />
        ) : (
          <View style={styles.noImageContainer}>
            <User size={40} color="#9CA3AF" />
          </View>
        )}
        {item.is_super_like && (
          <View style={styles.superLikeBadge}>
            <Text style={styles.superLikeText}>⭐</Text>
          </View>
        )}
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      </View>
      
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>
          {item.profile.first_name}, {item.profile.age}
        </Text>
        <Text style={styles.cardLocation}>{item.profile.city}</Text>
        <Text style={styles.cardTime}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMatchCard = ({ item }: { item: Match }) => (
    <TouchableOpacity
      style={styles.gridCard}
      onPress={() => handleChatPress(item.id, item.profile.first_name)}
    >
      <View style={styles.cardImageContainer}>
        {item.profile.photos && item.profile.photos.length > 0 ? (
          <Image source={{ uri: item.profile.photos[0] }} style={styles.cardImage} />
        ) : (
          <View style={styles.noImageContainer}>
            <User size={40} color="#9CA3AF" />
          </View>
        )}
        {item.unreadCount && item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
        <View style={styles.matchBadge}>
          <Text style={styles.matchBadgeText}>MATCH</Text>
        </View>
      </View>
      
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>
          {item.profile.first_name}, {item.profile.age}
        </Text>
        <Text style={styles.cardLocation}>{item.profile.city}</Text>
        {item.lastMessage ? (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage.content}
          </Text>
        ) : (
          <Text style={styles.noMessage}>Say hello! 👋</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Profile Modal Component
  const ProfileModal = () => {
    if (!selectedProfile) return null;

    const profile = selectedProfile.profile;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.modalCloseButton} 
            onPress={() => setShowProfileModal(false)}
          >
            <X size={24} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.modalProfileSection}>
            <View style={styles.modalImageContainer}>
              {profile.photos && profile.photos.length > 0 ? (
                <Image source={{ uri: profile.photos[0] }} style={styles.modalProfileImage} />
              ) : (
                <View style={styles.modalNoImageContainer}>
                  <User size={80} color="#9CA3AF" />
                </View>
              )}
            </View>

            <Text style={styles.modalProfileName}>
              {profile.first_name}, {profile.age}
            </Text>
            <Text style={styles.modalProfileLocation}>{profile.city}</Text>

            {profile.bio && (
              <View style={styles.modalAboutSection}>
                <Text style={styles.modalAboutTitle}>About</Text>
                <Text style={styles.modalAboutText}>{profile.bio}</Text>
              </View>
            )}

            {profile.interests && profile.interests.length > 0 && (
              <View style={styles.modalInterestsSection}>
                <Text style={styles.modalInterestsTitle}>Interests</Text>
                <View style={styles.modalInterestsContainer}>
                  {profile.interests.slice(0, 6).map((interest, index) => (
                    <View key={index} style={styles.modalInterestTag}>
                      <Text style={styles.modalInterestText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.modalActionButtons}>
            <TouchableOpacity style={styles.modalPassButton} onPress={handlePassLike}>
              <X size={24} color="#FF6B6B" />
              <Text style={styles.modalPassText}>Pass</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalLikeButton} onPress={handleAcceptLike}>
              <Heart size={24} color="#FFFFFF" />
              <Text style={styles.modalLikeText}>Like</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Matches</Text>
          <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
            <Bell size={24} color="#3B82F6" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matches</Text>
        <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
          <Bell size={24} color="#3B82F6" />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'likes' && styles.activeTab]}
          onPress={() => setActiveTab('likes')}
        >
          <Text style={[styles.tabText, activeTab === 'likes' && styles.activeTabText]}>
            Likes ({pendingLikes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'matches' && styles.activeTab]}
          onPress={() => setActiveTab('matches')}
        >
          <Text style={[styles.tabText, activeTab === 'matches' && styles.activeTabText]}>
            Matches ({matches.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'likes' ? (
        pendingLikes.length > 0 ? (
          <FlatList
            data={pendingLikes}
            renderItem={renderLikeCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Heart size={64} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No likes yet</Text>
            <Text style={styles.emptySubtitle}>
              People who like you will appear here
            </Text>
          </View>
        )
      ) : (
        matches.length > 0 ? (
          <FlatList
            data={matches}
            renderItem={renderMatchCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MessageCircle size={64} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptySubtitle}>
              Start liking profiles to create matches!
            </Text>
          </View>
        )
      )}

      {/* Profile Modal */}
      {showProfileModal && <ProfileModal />}
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
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontFamily: 'Inter-SemiBold',
  },
  gridContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    width: (screenWidth - 48) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardImageContainer: {
    position: 'relative',
    height: 200,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  superLikeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  superLikeText: {
    fontSize: 12,
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  matchBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  unreadBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  cardInfo: {
    padding: 12,
  },
  cardName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardLocation: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  lastMessage: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  noMessage: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    fontStyle: 'italic',
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
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 10,
  },
  modalProfileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    overflow: 'hidden',
  },
  modalProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  modalNoImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalProfileName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalProfileLocation: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 16,
  },
  modalAboutSection: {
    width: '100%',
    marginBottom: 16,
  },
  modalAboutTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalAboutText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    lineHeight: 24,
  },
  modalInterestsSection: {
    width: '100%',
  },
  modalInterestsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 12,
  },
  modalInterestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalInterestTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  modalInterestText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  modalPassButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalPassText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  modalLikeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalLikeText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});