import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthStoreState {
  anilistToken: string | null;
  anilistUserId: number | null;
  supabaseToken: string | null;
  scoreFormat: string | null;
  setAnilistToken: (token: string | null) => void;
  setAnilistUserId: (id: number | null) => void;
  setSupabaseToken: (token: string | null) => void;
  setScoreFormat: (format: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      anilistToken: null,
      anilistUserId: null,
      supabaseToken: null,
      scoreFormat: null,
      setAnilistToken: (token) => set({ anilistToken: token }),
      setAnilistUserId: (id) => set({ anilistUserId: id }),
      setSupabaseToken: (token) => set({ supabaseToken: token }),
      setScoreFormat: (format) => set({ scoreFormat: format }),
      logout: () =>
        set({ anilistToken: null, supabaseToken: null, anilistUserId: null, scoreFormat: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
