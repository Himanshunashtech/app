import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Use localStorage for web, AsyncStorage for mobile
const authStorage = Platform.OS === 'web' ? {
  getItem: (key: string) => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  },
} : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'dating-app',
    },
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          age: number;
          bio: string;
          city: string;
          latitude: number;
          longitude: number;
          interests: string[];
          photos: string[];
          looking_for: string;
          education: string;
          job_title: string;
          height: number;
          smoking: string;
          drinking: string;
          religion: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          age: number;
          bio?: string;
          city: string;
          latitude?: number;
          longitude?: number;
          interests?: string[];
          photos?: string[];
          looking_for: string;
          education?: string;
          job_title?: string;
          height?: number;
          smoking?: string;
          drinking?: string;
          religion?: string;
        };
        Update: {
          first_name?: string;
          age?: number;
          bio?: string;
          city?: string;
          latitude?: number;
          longitude?: number;
          interests?: string[];
          photos?: string[];
          looking_for?: string;
          education?: string;
          job_title?: string;
          height?: number;
          smoking?: string;
          drinking?: string;
          religion?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          liker_id: string;
          liked_id: string;
          is_super_like: boolean;
          created_at: string;
        };
        Insert: {
          liker_id: string;
          liked_id: string;
          is_super_like?: boolean;
        };
        Update: {
          is_super_like?: boolean;
        };
      };
      matches: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          created_at: string;
        };
        Insert: {
          user1_id: string;
          user2_id: string;
        };
        Update: {};
      };
      messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          match_id: string;
          sender_id: string;
          content: string;
        };
        Update: {
          content?: string;
        };
      };
    };
  };
};