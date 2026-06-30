import { useAuthStore } from './useAuthStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({ anilistToken: null, supabaseToken: null });
    jest.clearAllMocks();
  });

  it('debería inicializarse sin tokens', () => {
    const state = useAuthStore.getState();
    expect(state.anilistToken).toBeNull();
    expect(state.supabaseToken).toBeNull();
  });

  it('debería guardar el token de anilist', () => {
    useAuthStore.getState().setAnilistToken('test_anilist_token');
    const state = useAuthStore.getState();
    expect(state.anilistToken).toBe('test_anilist_token');
  });

  it('debería guardar el token de supabase', () => {
    useAuthStore.getState().setSupabaseToken('test_supabase_token');
    const state = useAuthStore.getState();
    expect(state.supabaseToken).toBe('test_supabase_token');
  });

  it('debería borrar ambos tokens al hacer logout', () => {
    useAuthStore.setState({
      anilistToken: 'token1',
      supabaseToken: 'token2'
    });
    
    useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    expect(state.anilistToken).toBeNull();
    expect(state.supabaseToken).toBeNull();
  });
});
