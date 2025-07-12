import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, X, Plus } from 'lucide-react-native';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  required?: boolean;
  minPhotos?: number;
}

export default function PhotoUpload({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 5, 
  required = false,
  minPhotos = 2 
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'We need camera and photo library permissions to upload photos.'
        );
        return false;
      }
    }
    return true;
  };

  const showImagePicker = async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Maximum Photos', `You can only upload up to ${maxPhotos} photos.`);
      return;
    }

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    if (Platform.OS === 'web') {
      // On web, only show gallery option
      pickImage();
    } else {
      Alert.alert(
        'Select Photo',
        'Choose how you want to add a photo',
        [
          { text: 'Camera', onPress: takePhoto },
          { text: 'Gallery', onPress: pickImage },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const takePhoto = async () => {
    try {
      setUploading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhotos = [...photos, result.assets[0].uri];
        onPhotosChange(newPhotos);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    try {
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhotos = [...photos, result.assets[0].uri];
        onPhotosChange(newPhotos);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Your Best Photos</Text>
      <Text style={styles.subtitle}>
        Upload at least {minPhotos} photos to get started. The first photo will be your main profile picture.
      </Text>
      
      <View style={styles.photosGrid}>
        {Array.from({ length: maxPhotos }).map((_, index) => (
          <View key={index} style={styles.photoSlot}>
            {photos[index] ? (
              <View style={styles.photoContainer}>
                <Image source={{ uri: photos[index] }} style={styles.photo} />
                {index === 0 && (
                  <View style={styles.mainPhotoLabel}>
                    <Text style={styles.mainPhotoText}>Main</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removePhoto(index)}
                >
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.addPhotoButton, 
                  uploading && styles.disabledButton,
                  index < minPhotos && styles.requiredPhotoButton
                ]}
                onPress={showImagePicker}
                disabled={uploading}
              >
                {uploading && index === photos.length ? (
                  <Text style={styles.addPhotoText}>Uploading...</Text>
                ) : (
                  <>
                    <Plus size={32} color={index < minPhotos ? "#EF4444" : "#3B82F6"} />
                    <Text style={[
                      styles.addPhotoText,
                      index < minPhotos && styles.requiredPhotoText
                    ]}>
                      {index === 0 ? 'Add Main Photo' : `Photo ${index + 1}`}
                    </Text>
                    {index < minPhotos && (
                      <Text style={styles.requiredLabel}>Required</Text>
                    )}
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {photos.length} of {maxPhotos} photos added
        </Text>
        {photos.length < minPhotos && (
          <Text style={styles.requirementText}>
            {minPhotos - photos.length} more photo{minPhotos - photos.length > 1 ? 's' : ''} required
          </Text>
        )}
      </View>

      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>Photo Tips:</Text>
        <Text style={styles.tipText}>• Use recent photos that clearly show your face</Text>
        <Text style={styles.tipText}>• Include photos that show your interests and personality</Text>
        <Text style={styles.tipText}>• Avoid group photos or photos with sunglasses</Text>
        <Text style={styles.tipText}>• Make sure photos are well-lit and high quality</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 16,
  },
  photoSlot: {
    width: 140,
    height: 180,
  },
  photoContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  mainPhotoLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mainPhotoText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addPhotoButton: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  requiredPhotoButton: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  disabledButton: {
    opacity: 0.5,
  },
  addPhotoText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#3B82F6',
    marginTop: 8,
    textAlign: 'center',
  },
  requiredPhotoText: {
    color: '#EF4444',
  },
  requiredLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#EF4444',
    marginTop: 4,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
  },
  tips: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  tipsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#0369A1',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#0369A1',
    marginBottom: 4,
    lineHeight: 20,
  },
});