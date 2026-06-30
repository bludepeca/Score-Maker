import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthStoreState {
  anilistToken: string | null;
  supabaseToken: string | null;
  setAnilistToken: (token: string | null) => void;
  setSupabaseToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      anilistToken: null,
      supabaseToken: null,
      setAnilistToken: (token) => set({ anilistToken: token }),
      setSupabaseToken: (token) => set({ supabaseToken: token }),
      logout: () => set({ anilistToken: null, supabaseToken: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
