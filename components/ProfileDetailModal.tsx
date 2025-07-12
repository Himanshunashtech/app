import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, ScrollView, Dimensions } from 'react-native';
import { User, Heart, X, MapPin, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ProfileDetailModalProps {
  visible: boolean;
  profile: {
    id: string;
    first_name: string;
    age: number;
    city: string;
    photos: string[];
    bio: string;
    interests: string[];
    job_title?: string;
    education?: string;
  } | null;
  onLike: () => void;
  onPass: () => void;
  onClose: () => void;
}

export default function ProfileDetailModal({ 
  visible, 
  profile, 
  onLike, 
  onPass, 
  onClose 
}: ProfileDetailModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!profile) return null;

  const nextPhoto = () => {
    if (profile.photos.length > 1) {
      setCurrentPhotoIndex((prev) => 
        prev < profile.photos.length - 1 ? prev + 1 : 0
      );
    }
  };

  const prevPhoto = () => {
    if (profile.photos.length > 1) {
      setCurrentPhotoIndex((prev) => 
        prev > 0 ? prev - 1 : profile.photos.length - 1
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.photoContainer}>
            {profile.photos && profile.photos.length > 0 ? (
              <>
                <Image 
                  source={{ uri: profile.photos[currentPhotoIndex] }} 
                  style={styles.profileImage}
                />
                {profile.photos.length > 1 && (
                  <>
                    <TouchableOpacity style={styles.prevButton} onPress={prevPhoto}>
                      <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.nextButton} onPress={nextPhoto}>
                      <ChevronRight size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.photoIndicators}>
                      {profile.photos.map((_, index) => (
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
                {profile.first_name}, {profile.age}
              </Text>
              <View style={styles.locationContainer}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.locationText}>{profile.city}</Text>
              </View>
            </View>

            {profile.job_title && (
              <View style={styles.jobContainer}>
                <Briefcase size={16} color="#6B7280" />
                <Text style={styles.jobText}>{profile.job_title}</Text>
              </View>
            )}

            {profile.bio && (
              <View style={styles.aboutSection}>
                <Text style={styles.aboutTitle}>About</Text>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </View>
            )}

            {profile.interests.length > 0 && (
              <View style={styles.interestsSection}>
                <Text style={styles.interestsTitle}>Interests</Text>
                <View style={styles.interestsContainer}>
                  {profile.interests.map((interest, index) => (
                    <View key={index} style={styles.interestTag}>
                      <Text style={styles.interestText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {profile.education && (
              <View style={styles.educationSection}>
                <Text style={styles.educationTitle}>Education</Text>
                <Text style={styles.educationText}>{profile.education}</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.passButton} onPress={onPass}>
            <X size={28} color="#FF6B6B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.likeButton} onPress={onLike}>
            <Heart size={28} color="#4ADE80" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
  },
  photoContainer: {
    height: screenHeight * 0.6,
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
    top: 100,
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
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
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
    gap: 48,
  },
  passButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#4ADE80',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});