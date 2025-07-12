import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Phone, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PhotoUpload from '@/components/PhotoUpload';
import LocationPicker from '@/components/LocationPicker';
import AgeSelector from '@/components/AgeSelector';

const { width, height } = Dimensions.get('window');

const onboardingSteps = [
  {
    id: 'phone',
    title: 'What\'s your phone number?',
    subtitle: 'We\'ll send you a verification code',
    type: 'phone',
  },
  {
    id: 'location',
    title: 'Where are you located?',
    subtitle: 'Help us find matches near you',
    type: 'location',
  },
  {
    id: 'name',
    title: 'What\'s your first name?',
    subtitle: 'This is how you\'ll appear to others',
    type: 'text',
    field: 'first_name',
    placeholder: 'Enter your first name',
  },
  {
    id: 'age',
    title: 'How old are you?',
    subtitle: 'Your age will be public',
    type: 'age',
  },
  {
    id: 'looking_for',
    title: 'What are you looking for?',
    subtitle: 'You can change this later',
    type: 'select',
    field: 'looking_for',
    options: [
      { value: 'relationship', label: 'Long-term relationship', emoji: '💕' },
      { value: 'friendship', label: 'New friends', emoji: '👫' },
      { value: 'casual', label: 'Something casual', emoji: '😊' },
      { value: 'not_sure', label: 'Not sure yet', emoji: '🤔' },
    ],
  },
  {
    id: 'interests',
    title: 'What are your interests?',
    subtitle: 'Select at least 3 interests',
    type: 'multi_select',
    field: 'interests',
    options: [
      'Travel', 'Music', 'Sports', 'Reading', 'Cooking', 'Art', 
      'Technology', 'Nature', 'Photography', 'Dancing', 'Fitness', 
      'Movies', 'Gaming', 'Fashion', 'Food', 'Pets'
    ],
  },
  {
    id: 'lifestyle',
    title: 'Tell us about your lifestyle',
    subtitle: 'This helps us find compatible matches',
    type: 'lifestyle',
  },
  {
    id: 'bio',
    title: 'Write something about yourself',
    subtitle: 'Share what makes you unique',
    type: 'textarea',
    field: 'bio',
    placeholder: 'Tell us about yourself, your hobbies, what you\'re passionate about...',
  },
  {
    id: 'photos',
    title: 'Add your best photos',
    subtitle: 'Upload at least 2 photos to get started',
    type: 'photos',
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const updateAnswer = (key: string, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleLocationSelected = (location: { city: string; latitude: number; longitude: number }) => {
    updateAnswer('city', location.city);
    updateAnswer('latitude', location.latitude);
    updateAnswer('longitude', location.longitude);
  };

  const uploadPhotosToStorage = async (photos: string[]): Promise<string[]> => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    if (photos.length === 0) {
      return [];
    }

    // Check if Supabase is properly configured
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Supabase configuration missing. Please check your environment variables.');
    }

    const uploadedUrls: string[] = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      try {
        // Add timeout and better error handling for fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(photo, {
          signal: controller.signal,
          headers: {
            'Accept': 'image/*',
          },
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        
        // Validate blob size (max 5MB)
        if (blob.size > 5 * 1024 * 1024) {
          throw new Error('Image too large. Please choose an image under 5MB.');
        }
        
        const fileExt = 'jpg';
        const fileName = `${user.id}/photo_${i + 1}_${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: true,
            cacheControl: '3600'
          });

        if (error) {
          console.error('Upload error:', error);
          throw new Error(`Upload failed: ${error.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      } catch (error: any) {
        console.error('Error uploading photo:', error);
        if (error.name === 'AbortError') {
          throw new Error('Upload timeout. Please check your internet connection and try again.');
        }
        throw error;
      }
    }

    return uploadedUrls;
  };

  const validateStep = () => {
    const currentStepData = onboardingSteps[currentStep];
    
    switch (currentStepData.type) {
      case 'phone':
        if (!answers.phone || answers.phone.length < 10) {
          Alert.alert('Required', 'Please enter a valid phone number');
          return false;
        }
        break;
      case 'location':
        if (!answers.city) {
          Alert.alert('Required', 'Please select your location');
          return false;
        }
        break;
      case 'text':
        if (!answers[currentStepData.field!] || answers[currentStepData.field!].trim().length === 0) {
          Alert.alert('Required', `Please enter your ${currentStepData.field}`);
          return false;
        }
        break;
      case 'age':
        if (!answers.age || answers.age < 18 || answers.age > 100) {
          Alert.alert('Required', 'Please select a valid age (18-100)');
          return false;
        }
        break;
      case 'select':
        if (!answers[currentStepData.field!]) {
          Alert.alert('Required', 'Please make a selection');
          return false;
        }
        break;
      case 'multi_select':
        if (!answers[currentStepData.field!] || answers[currentStepData.field!].length < 3) {
          Alert.alert('Required', 'Please select at least 3 interests');
          return false;
        }
        break;
      case 'lifestyle':
        if (!answers.smoking || !answers.drinking) {
          Alert.alert('Required', 'Please complete all lifestyle questions');
          return false;
        }
        break;
      case 'photos':
        if (!answers.photos || answers.photos.length < 2) {
          Alert.alert('Required', 'Please upload at least 2 photos');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      const uploadedPhotos = await uploadPhotosToStorage(answers.photos || []);

      const profileData = {
        id: user?.id!,
        email: user?.email || '',
        ...answers,
        interests: answers.interests || [],
        photos: uploadedPhotos,
      };

      const { error } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (error) throw error;

      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    const step = onboardingSteps[currentStep];

    switch (step.type) {
      case 'phone':
        return (
          <View style={styles.inputContainer}>
            <Phone size={24} color="#3B82F6" />
            <TextInput
              style={styles.phoneInput}
              placeholder="Enter your phone number"
              value={answers.phone || ''}
              onChangeText={(value) => updateAnswer('phone', value)}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>
        );

      case 'location':
        return (
          <LocationPicker
            onLocationSelected={handleLocationSelected}
            selectedLocation={answers.city}
          />
        );

      case 'text':
        return (
          <TextInput
            style={styles.textInput}
            placeholder={step.placeholder}
            value={answers[step.field!] || ''}
            onChangeText={(value) => updateAnswer(step.field!, value)}
            autoCapitalize="words"
          />
        );

      case 'age':
        return (
          <AgeSelector
            selectedAge={answers.age}
            onAgeSelected={(age) => updateAnswer('age', age)}
          />
        );

      case 'select':
        return (
          <View style={styles.optionsContainer}>
            {step.options!.map((option: any) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  answers[step.field!] === option.value && styles.selectedOptionCard
                ]}
                onPress={() => updateAnswer(step.field!, option.value)}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text style={[
                  styles.optionLabel,
                  answers[step.field!] === option.value && styles.selectedOptionLabel
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'multi_select':
        return (
          <View style={styles.multiSelectContainer}>
            {step.options!.map((option: string) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.interestTag,
                  (answers[step.field!] || []).includes(option.toLowerCase()) && styles.selectedInterestTag
                ]}
                onPress={() => {
                  const current = answers[step.field!] || [];
                  const optionLower = option.toLowerCase();
                  const newValue = current.includes(optionLower)
                    ? current.filter((item: string) => item !== optionLower)
                    : [...current, optionLower];
                  updateAnswer(step.field!, newValue);
                }}
              >
                <Text style={[
                  styles.interestText,
                  (answers[step.field!] || []).includes(option.toLowerCase()) && styles.selectedInterestText
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'lifestyle':
        return (
          <View style={styles.lifestyleContainer}>
            <View style={styles.lifestyleQuestion}>
              <Text style={styles.lifestyleLabel}>Do you smoke?</Text>
              <View style={styles.lifestyleOptions}>
                {['never', 'sometimes', 'regularly'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.lifestyleOption,
                      answers.smoking === option && styles.selectedLifestyleOption
                    ]}
                    onPress={() => updateAnswer('smoking', option)}
                  >
                    <Text style={[
                      styles.lifestyleOptionText,
                      answers.smoking === option && styles.selectedLifestyleOptionText
                    ]}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.lifestyleQuestion}>
              <Text style={styles.lifestyleLabel}>Do you drink?</Text>
              <View style={styles.lifestyleOptions}>
                {['never', 'sometimes', 'regularly'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.lifestyleOption,
                      answers.drinking === option && styles.selectedLifestyleOption
                    ]}
                    onPress={() => updateAnswer('drinking', option)}
                  >
                    <Text style={[
                      styles.lifestyleOptionText,
                      answers.drinking === option && styles.selectedLifestyleOptionText
                    ]}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Education (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Bachelor's in Computer Science"
                value={answers.education || ''}
                onChangeText={(value) => updateAnswer('education', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Job Title (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Software Engineer"
                value={answers.job_title || ''}
                onChangeText={(value) => updateAnswer('job_title', value)}
              />
            </View>
          </View>
        );

      case 'textarea':
        return (
          <TextInput
            style={styles.textArea}
            placeholder={step.placeholder}
            value={answers[step.field!] || ''}
            onChangeText={(value) => updateAnswer(step.field!, value)}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        );

      case 'photos':
        return (
          <PhotoUpload
            photos={answers.photos || []}
            onPhotosChange={(photos) => updateAnswer('photos', photos)}
            maxPhotos={5}
            minPhotos={2}
            required={true}
          />
        );

      default:
        return null;
    }
  };

  const currentStepData = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#3B82F6', '#1E40AF']}
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{currentStep + 1} of {onboardingSteps.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
        </View>
        
        <View style={styles.contentContainer}>
          {renderStepContent()}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <ChevronLeft size={24} color="#3B82F6" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.nextButton, loading && styles.disabledButton]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.nextButtonText}>
            {loading ? 'Creating Profile...' : currentStep === onboardingSteps.length - 1 ? 'Complete' : 'Continue'}
          </Text>
          {!loading && currentStep < onboardingSteps.length - 1 && (
            <ChevronRight size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 12,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  contentContainer: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
    marginLeft: 12,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    height: 120,
    textAlignVertical: 'top',
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  selectedOptionCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  optionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  selectedOptionLabel: {
    color: '#3B82F6',
  },
  multiSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interestTag: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedInterestTag: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  interestText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  selectedInterestText: {
    color: '#3B82F6',
  },
  lifestyleContainer: {
    gap: 24,
  },
  lifestyleQuestion: {
    gap: 12,
  },
  lifestyleLabel: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  lifestyleOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  lifestyleOption: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  selectedLifestyleOption: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  lifestyleOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1F2937',
  },
  selectedLifestyleOptionText: {
    color: '#3B82F6',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#3B82F6',
    marginLeft: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginRight: 4,
  },
});