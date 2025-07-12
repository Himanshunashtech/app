import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { MapPin, Navigation, Check } from 'lucide-react-native';

interface LocationPickerProps {
  onLocationSelected: (location: { city: string; latitude: number; longitude: number }) => void;
  selectedLocation?: string;
}

export default function LocationPicker({ onLocationSelected, selectedLocation }: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    city: string;
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'We need location permission to help you find matches nearby.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Grant Permission', onPress: requestLocationPermission },
          ]
        );
        return;
      }
      
      // Automatically get current location
      getCurrentLocation();
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    if (Platform.OS === 'web') {
      // For web, use browser geolocation API
      if (navigator.geolocation) {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await reverseGeocode(latitude, longitude);
          },
          (error) => {
            console.error('Geolocation error:', error);
            setLoading(false);
            Alert.alert('Location Error', 'Unable to get your current location. Please try again.');
          }
        );
      } else {
        Alert.alert('Location Not Supported', 'Geolocation is not supported by this browser.');
      }
      return;
    }

    setLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      await reverseGeocode(latitude, longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get your current location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const reverseGeocodedAddress = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocodedAddress.length > 0) {
        const address = reverseGeocodedAddress[0];
        const city = address.city || address.subAdministrativeArea || address.region || 'Unknown City';
        
        const locationData = {
          city,
          latitude,
          longitude,
        };

        setCurrentLocation(locationData);
        onLocationSelected(locationData);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      Alert.alert('Location Error', 'Unable to determine your city. Please try again.');
    }
  };

  if (selectedLocation && currentLocation) {
    return (
      <View style={styles.selectedContainer}>
        <View style={styles.selectedIcon}>
          <Check size={24} color="#10B981" />
        </View>
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedText}>Location detected</Text>
          <Text style={styles.selectedCity}>{currentLocation.city}</Text>
        </View>
        <TouchableOpacity
          style={styles.changeButton}
          onPress={getCurrentLocation}
        >
          <Text style={styles.changeButtonText}>Change</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.locationButton, loading && styles.disabledButton]}
        onPress={getCurrentLocation}
        disabled={loading}
      >
        <View style={styles.buttonContent}>
          <Navigation size={24} color="#3B82F6" />
          <View style={styles.buttonText}>
            <Text style={styles.buttonTitle}>
              {loading ? 'Getting your location...' : 'Use my current location'}
            </Text>
            <Text style={styles.buttonSubtitle}>
              We'll automatically detect your city
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity style={styles.manualButton}>
        <MapPin size={20} color="#6B7280" />
        <Text style={styles.manualButtonText}>Enter city manually</Text>
      </TouchableOpacity>

      <Text style={styles.privacyNote}>
        Your location is used to show you matches in your area and will be visible to other users.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  locationButton: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    marginLeft: 16,
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginHorizontal: 16,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  manualButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginLeft: 12,
  },
  privacyNote: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  selectedIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#059669',
    marginBottom: 2,
  },
  selectedCity: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#065F46',
  },
  changeButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  changeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});