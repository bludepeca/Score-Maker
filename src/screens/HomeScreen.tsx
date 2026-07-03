import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery } from '@apollo/client/react';
import { GET_VIEWER, GET_USER_ANIME_LIST } from '../api/queries';
// useFocusEffect eliminado: usaba useContext(NavigationStateContext) internamente,
// lo que crasheaba en Android cuando Apollo hacía re-fetch en background.
import { db } from '../db';
import { scores } from '../db/schema';

export default function HomeScreen({ navigation }: any) {
  const logout = useAuthStore((state) => state.logout);
  const setAnilistUserId = useAuthStore((state) => state.setAnilistUserId);
  const setScoreFormat = useAuthStore((state) => state.setScoreFormat);

  // 1. Obtener los datos del usuario actual
  const {
    data: viewerData,
    loading: viewerLoading,
    error: viewerError,
  } = useQuery<any>(GET_VIEWER);

  // 2. Extraer el userId dinámicamente de la respuesta
  const userId = viewerData?.Viewer?.id;
  const scoreFormat = viewerData?.Viewer?.mediaListOptions?.scoreFormat;

  React.useEffect(() => {
    if (userId) setAnilistUserId(userId);
    if (scoreFormat) setScoreFormat(scoreFormat);
  }, [userId, scoreFormat, setAnilistUserId, setScoreFormat]);

  // 3. Estado de la pestaña activa
  const [activeTab, setActiveTab] = useState<'ANIME' | 'MANGA'>('ANIME');

  const {
    data: animeData,
    loading: animeLoading,
    error: animeError,
  } = useQuery<any>(GET_USER_ANIME_LIST, {
    variables: { userId, type: 'ANIME' },
    skip: !userId,
  });

  const {
    data: mangaData,
    loading: mangaLoading,
    error: mangaError,
  } = useQuery<any>(GET_USER_ANIME_LIST, {
    variables: { userId, type: 'MANGA' },
    skip: !userId,
  });

  const handleLogout = () => {
    logout();
  };

  const [localScores, setLocalScores] = useState<Record<number, number>>({});

  // Usamos useCallback para estabilizar la función y no recrearla en cada render
  const fetchLocalScores = useCallback(async () => {
    try {
      const rows = await db.select().from(scores);
      const scoreMap: Record<number, number> = {};
      for (const r of rows) {
        scoreMap[r.animeId] = r.finalScore;
      }
      setLocalScores(scoreMap);
    } catch (e) {
      console.error('Error fetching local scores:', e);
    }
  }, []);

  // navigation.addListener('focus') usa la PROP directamente, no un hook de contexto.
  // Esto evita el crash en Android cuando Apollo hace re-fetch en background.
  useEffect(() => {
    // Carga inicial al montar
    fetchLocalScores();
    // Re-carga cada vez que la pantalla vuelve a estar en foco
    const unsubscribe = navigation.addListener('focus', fetchLocalScores);
    return unsubscribe;
  }, [navigation, fetchLocalScores]);

  const renderAnimeItem = ({ item }: any) => {
    const anime = item?.media;
    if (!anime) return null; // Safe guard

    const statusTranslate: Record<string, string> = {
      CURRENT: 'Viendo',
      COMPLETED: 'Completado',
      PAUSED: 'Pausado',
      DROPPED: 'Abandonado',
      PLANNING: 'Planeado',
    };

    const localScore = localScores[anime.id];
    const anilistScore = item.score;
    const hasLocal = localScore !== undefined;
    const displayScore = hasLocal ? localScore : anilistScore;

    return (
      <TouchableOpacity
        className="flex-row bg-white dark:bg-zinc-900 rounded-2xl mb-4 overflow-hidden border border-zinc-200 dark:border-zinc-800"
        style={styles.cardShadow}
        onPress={() =>
          navigation.navigate('AnimeDetail', {
            anime,
            hasLocal,
            localScore,
            anilistScore,
            displayScore,
          })
        }
      >
        <Image
          source={{ uri: anime.coverImage?.large || 'https://via.placeholder.com/150' }}
          className="w-24 h-36 bg-zinc-200 dark:bg-zinc-800"
          resizeMode="cover"
        />
        <View className="flex-1 p-4 justify-center">
          <Text className="text-zinc-900 dark:text-white font-bold text-lg mb-1" numberOfLines={2}>
            {anime.title?.romaji || 'Desconocido'}
          </Text>
          <Text className="text-zinc-500 dark:text-zinc-400 text-sm mb-3">
            {statusTranslate[item.status] || item.status || 'Desconocido'} •{' '}
            {anime.episodes ? `${anime.episodes} eps` : '? eps'}
          </Text>
          <View className="flex-row items-center justify-between">
            {displayScore > 0 ? (
              <View
                className="px-3 py-1 rounded-full border"
                style={hasLocal ? styles.localScoreBadge : styles.anilistScoreBadge}
              >
                <Text
                  className={`${hasLocal ? 'text-blue-400' : 'text-green-400'} font-bold text-xs`}
                >
                  {hasLocal ? `Local: ${displayScore}` : `AniList: ${displayScore}`}
                </Text>
              </View>
            ) : (
              <View className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700">
                <Text className="text-zinc-500 dark:text-zinc-400 font-bold text-xs">
                  Sin puntuar
                </Text>
              </View>
            )}
            <View className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 ml-2">
              <Text className="text-zinc-700 dark:text-zinc-300 font-bold text-xs">
                {hasLocal ? 'Editar Nota' : 'Puntuar ahora'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isLoading = viewerLoading || (activeTab === 'ANIME' ? animeLoading : mangaLoading);
  const error = viewerError || (activeTab === 'ANIME' ? animeError : mangaError);

  // Sorting function
  const sortMediaList = (list: any[]) => {
    return [...list].sort((a: any, b: any) => {
      const aMedia = a?.media;
      const bMedia = b?.media;
      if (!aMedia) return 1;
      if (!bMedia) return -1;

      const aLocal = localScores[aMedia.id];
      const bLocal = localScores[bMedia.id];
      const aHasScore = aLocal !== undefined || (a.score && a.score > 0);
      const bHasScore = bLocal !== undefined || (b.score && b.score > 0);

      if (aHasScore !== bHasScore) {
        return aHasScore ? 1 : -1; // Unscored first
      }

      if (!aHasScore && !bHasScore) {
        const statusWeight: Record<string, number> = {
          COMPLETED: 5,
          CURRENT: 4,
          PAUSED: 3,
          DROPPED: 2,
          PLANNING: 1,
        };
        const aWeight = statusWeight[a.status] || 0;
        const bWeight = statusWeight[b.status] || 0;
        if (aWeight !== bWeight) {
          return bWeight - aWeight;
        }
      }

      return 0; // Keep original order for same group
    });
  };

  const animeList = sortMediaList(animeData?.Page?.mediaList || []);
  const mangaList = sortMediaList(mangaData?.Page?.mediaList || []);

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 pt-12">
      {/* HEADER */}
      <View className="flex-row justify-between items-center mb-8">
        <View>
          <Text className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs mb-1">
            Bienvenido
          </Text>
          <Text className="text-3xl font-black text-zinc-900 dark:text-white">
            {viewerData?.Viewer?.name || 'Cargando...'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          {viewerData?.Viewer?.avatar?.large ? (
            <Image
              source={{ uri: viewerData?.Viewer?.avatar?.large }}
              className="w-12 h-12 rounded-full border-2 border-blue-500"
            />
          ) : (
            <View className="w-12 h-12 rounded-full bg-zinc-800" />
          )}
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-between items-end mb-4">
        <Text className="text-xl font-bold text-zinc-800 dark:text-white">Actividad Reciente</Text>
      </View>

      {/* TABS — using inline styles instead of conditional className with shadow-*
         to avoid the NativeWind CSS interop race condition that destroys
         NavigationStateContext on re-render (GitHub: nativewind#1536) */}
      <View className="flex-row bg-zinc-200 dark:bg-zinc-800 rounded-xl p-1 mb-6">
        <TouchableOpacity
          className="flex-1 py-2 items-center rounded-lg"
          style={activeTab === 'ANIME' ? styles.activeTab : undefined}
          onPress={() => setActiveTab('ANIME')}
        >
          <Text
            className="font-bold"
            style={activeTab === 'ANIME' ? styles.activeTabText : styles.inactiveTabText}
          >
            Animes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-2 items-center rounded-lg"
          style={activeTab === 'MANGA' ? styles.activeTab : undefined}
          onPress={() => setActiveTab('MANGA')}
        >
          <Text
            className="font-bold"
            style={activeTab === 'MANGA' ? styles.activeTabText : styles.inactiveTabText}
          >
            Mangas
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTADOS: Ambos renderizados para un switch instantáneo */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-zinc-500 mt-4 font-bold">Obteniendo tu lista de AniList...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-400 font-bold text-center">
            Hubo un error cargando tus datos. Verifica tu conexión.
          </Text>
        </View>
      ) : (
        <View className="flex-1 relative">
          <View className="flex-1" style={{ display: activeTab === 'ANIME' ? 'flex' : 'none' }}>
            <FlatList
              data={animeList}
              keyExtractor={(item, index) => item?.media?.id?.toString() || `anime-${index}`}
              renderItem={renderAnimeItem}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          </View>
          <View className="flex-1" style={{ display: activeTab === 'MANGA' ? 'flex' : 'none' }}>
            <FlatList
              data={mangaList}
              keyExtractor={(item, index) => item?.media?.id?.toString() || `manga-${index}`}
              renderItem={renderAnimeItem}
              showsVerticalScrollIndicator={false}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          </View>
        </View>
      )}
    </View>
  );
}

// Styles moved out of NativeWind conditional template literals to avoid
// the CSS interop race condition that destroys NavigationStateContext
// on re-render (GitHub: nativewind#1536, nativewind#1711).
// Trigger patterns: shadow-*, color/opacity shorthand in template literals.
const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  activeTabText: {
    color: '#18181b', // zinc-900
  },
  inactiveTabText: {
    color: '#71717a', // zinc-500
  },
  localScoreBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)', // blue-600/20
    borderColor: 'rgba(59, 130, 246, 0.3)', // blue-500/30
  },
  anilistScoreBadge: {
    backgroundColor: 'rgba(22, 163, 74, 0.2)', // green-600/20
    borderColor: 'rgba(34, 197, 94, 0.3)', // green-500/30
  },
});
