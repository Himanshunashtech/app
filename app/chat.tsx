import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Send, Heart, Smile, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';

interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'emoji' | 'like';
  created_at: string;
  read_at?: string;
}

interface UserStatus {
  user_id: string;
  is_online: boolean;
  last_seen: string;
  is_typing: boolean;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { matchId, profileName } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const emojis = ['❤️', '😍', '😘', '🥰', '😊', '😂', '🔥', '👍', '🎉', '💯'];

  useEffect(() => {
    fetchMessages();
    subscribeToMessages();
    subscribeToUserStatus();
    markMessagesAsRead();
    updateOnlineStatus(true);

    return () => {
      updateOnlineStatus(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const updateOnlineStatus = async (isOnline: boolean) => {
    if (!user) return;

    try {
      await supabase
        .from('user_status')
        .upsert({
          user_id: user.id,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
          is_typing: false,
        });
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  const updateTypingStatus = async (typing: boolean) => {
    if (!user) return;

    try {
      await supabase
        .from('user_status')
        .upsert({
          user_id: user.id,
          is_typing: typing,
          last_seen: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  const subscribeToUserStatus = () => {
    if (!user) return;

    // Get other user ID from match
    const getOtherUserId = async () => {
      const { data: match } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .eq('id', matchId)
        .single();

      if (match) {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        
        // Subscribe to other user's status
        const channel = supabase
          .channel('user_status')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_status',
              filter: `user_id=eq.${otherUserId}`,
            },
            (payload) => {
              setUserStatus(payload.new as UserStatus);
            }
          )
          .subscribe();

        // Get initial status
        const { data: status } = await supabase
          .from('user_status')
          .select('*')
          .eq('user_id', otherUserId)
          .maybeSingle();

        if (status) {
          setUserStatus(status);
        }

        return () => {
          supabase.removeChannel(channel);
        };
      }
    };

    getOtherUserId();
  };

  const fetchMessages = async () => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(messages || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Mark as read if not from current user
          if (newMessage.sender_id !== user?.id) {
            markMessageAsRead(newMessage.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async () => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('match_id', matchId)
        .neq('sender_id', user.id)
        .is('read_at', null);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const sendMessage = async (content: string, type: 'text' | 'emoji' | 'like' = 'text') => {
    if (!content.trim() && type === 'text') return;
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          match_id: matchId as string,
          sender_id: user.id,
          content: content.trim() || '❤️',
          message_type: type,
        }]);

      if (error) throw error;

      if (type === 'text') {
        setNewMessage('');
      }
      setShowEmojiPicker(false);
      updateTypingStatus(false);
    } catch (error: any) {
      console.error('Error sending message:', error.message);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const handleTextChange = (text: string) => {
    setNewMessage(text);
    
    // Update typing status
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      updateTypingStatus(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 2000);
  };

  const sendLike = () => {
    sendMessage('❤️', 'like');
  };

  const sendEmoji = (emoji: string) => {
    sendMessage(emoji, 'emoji');
  };

  const getStatusText = () => {
    if (!userStatus) return '';
    
    if (userStatus.is_typing) return 'typing...';
    if (userStatus.is_online) return 'online';
    
    const lastSeen = new Date(userStatus.last_seen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === user?.id;
    const isLike = item.message_type === 'like';
    const isEmoji = item.message_type === 'emoji';
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.otherMessage
      ]}>
        {isLike ? (
          <View style={styles.likeMessage}>
            <Heart size={24} color={isMyMessage ? "#FFFFFF" : "#EF4444"} fill={isMyMessage ? "#FFFFFF" : "#EF4444"} />
          </View>
        ) : (
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText,
            isEmoji && styles.emojiText
          ]}>
            {item.content}
          </Text>
        )}
        
        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.otherMessageTime
          ]}>
            {new Date(item.created_at).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
          {isMyMessage && (
            <Text style={styles.readStatus}>
              {item.read_at ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#3B82F6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{profileName}</Text>
          <TouchableOpacity>
            <MoreHorizontal size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#3B82F6" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{profileName}</Text>
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
        <TouchableOpacity>
          <MoreHorizontal size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {showEmojiPicker && (
        <View style={styles.emojiPicker}>
          <FlatList
            data={emojis}
            horizontal
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.emojiButton}
                onPress={() => sendEmoji(item)}
              >
                <Text style={styles.emojiText}>{item}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.emojiToggle}
          onPress={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <Smile size={24} color="#6B7280" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          multiline
          maxLength={500}
        />
        
        <TouchableOpacity
          style={styles.likeButton}
          onPress={sendLike}
        >
          <Heart size={20} color="#EF4444" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={() => sendMessage(newMessage)}
          disabled={!newMessage.trim()}
        >
          <Send size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#10B981',
    marginTop: 2,
  },
  messagesContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexGrow: 1,
  },
  messageContainer: {
    maxWidth: '80%',
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#1F2937',
  },
  emojiText: {
    fontSize: 24,
    lineHeight: 28,
  },
  likeMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#9CA3AF',
  },
  readStatus: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 4,
  },
  emojiPicker: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  emojiButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
    gap: 12,
  },
  emojiToggle: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    maxHeight: 100,
  },
  likeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
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
});