import { create } from 'zustand';
import { db } from '../db';
import { criteria } from '../db/schema';

interface ScoreStoreState {
  currentAnimeId: number | null;
  setCurrentAnimeId: (id: number | null) => void;
  // This will be expanded later to hold criteria state if needed for rapid prototyping without DB hits,
  // but since we are offline-first with SQLite, Zustand can act as a UI state cache.
}

export const useScoreStore = create<ScoreStoreState>((set) => ({
  currentAnimeId: null,
  setCurrentAnimeId: (id) => set({ currentAnimeId: id }),
}));
