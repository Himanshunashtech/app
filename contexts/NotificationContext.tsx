import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  type: 'like' | 'message' | 'match' | 'friend_request_accepted';
  title: string;
  message: string;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to likes
    const likesChannel = supabase
      .channel('likes_notifications')
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
          
          // Get the liker's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('id', like.liker_id)
            .maybeSingle();

          showNotification({
            type: 'like',
            title: 'New Like!',
            message: `${profile?.first_name || 'Someone'} ${like.is_super_like ? 'super liked' : 'liked'} you!`,
            data: { likeId: like.id, likerId: like.liker_id },
          });
        }
      )
      .subscribe();

    // Subscribe to matches
    const matchesChannel = supabase
      .channel('matches_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `or(user1_id.eq.${user.id},user2_id.eq.${user.id})`,
        },
        async (payload) => {
          const match = payload.new;
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          
          // Get the other user's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('id', otherUserId)
            .maybeSingle();

          showNotification({
            type: 'match',
            title: "It's a Match! 🎉",
            message: `You and ${profile?.first_name || 'someone'} liked each other!`,
            data: { matchId: match.id, otherUserId },
          });
        }
      )
      .subscribe();

    // Subscribe to messages
    const messagesChannel = supabase
      .channel('messages_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const message = payload.new;
          
          // Only show notification if the message is not from the current user
          if (message.sender_id === user.id) return;

          // Check if this message is in a match where the current user is involved
          const { data: match } = await supabase
            .from('matches')
            .select('user1_id, user2_id')
            .eq('id', message.match_id)
            .maybeSingle();

          if (!match || (match.user1_id !== user.id && match.user2_id !== user.id)) return;

          // Get the sender's profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('id', message.sender_id)
            .maybeSingle();

          showNotification({
            type: 'message',
            title: 'New Message',
            message: `${profile?.first_name || 'Someone'}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
            data: { matchId: message.match_id, senderId: message.sender_id },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user]);

  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      showNotification,
      dismissNotification,
      clearAllNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}