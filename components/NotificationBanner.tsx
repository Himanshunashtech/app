import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Heart, MessageCircle, UserCheck, X } from 'lucide-react-native';

interface NotificationBannerProps {
  visible: boolean;
  type: 'like' | 'message' | 'match' | 'friend_request_accepted';
  title: string;
  message: string;
  onPress?: () => void;
  onDismiss: () => void;
  autoHide?: boolean;
  duration?: number;
}

export default function NotificationBanner({
  visible,
  type,
  title,
  message,
  onPress,
  onDismiss,
  autoHide = true,
  duration = 4000,
}: NotificationBannerProps) {
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      if (autoHide) {
        const timer = setTimeout(() => {
          hideNotification();
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  const hideNotification = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const getIcon = () => {
    switch (type) {
      case 'like':
        return <Heart size={20} color="#FFFFFF" />;
      case 'message':
        return <MessageCircle size={20} color="#FFFFFF" />;
      case 'match':
        return <Heart size={20} color="#FFFFFF" />;
      case 'friend_request_accepted':
        return <UserCheck size={20} color="#FFFFFF" />;
      default:
        return <Heart size={20} color="#FFFFFF" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'like':
        return '#EF4444';
      case 'message':
        return '#3B82F6';
      case 'match':
        return '#10B981';
      case 'friend_request_accepted':
        return '#8B5CF6';
      default:
        return '#3B82F6';
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY: slideAnim }] 
        }
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={onPress}
        activeOpacity={onPress ? 0.8 : 1}
      >
        <View style={styles.iconContainer}>
          {getIcon()}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={hideNotification}>
          <X size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});