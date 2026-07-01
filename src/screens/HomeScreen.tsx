import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery } from '@apollo/client/react';
import { GET_VIEWER, GET_USER_ANIME_LIST } from '../api/queries';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../db';
import { scores } from '../db/schema';

export default function HomeScreen({ navigation }: any) {
  const logout = useAuthStore((state) => state.logout);
  const setAnilistUserId = useAuthStore((state) => state.setAnilistUserId);

  // 1. Obtener los datos del usuario actual
  const { data: viewerData, loading: viewerLoading, error: viewerError } = useQuery(GET_VIEWER);

  // 2. Extraer el userId dinámicamente de la respuesta
  const userId = viewerData?.Viewer?.id;
  React.useEffect(() => {
    if (userId) setAnilistUserId(userId);
  }, [userId, setAnilistUserId]);

  // 3. Obtener su lista de animes (recientes en general), SOLO si ya tenemos el userId
  const {
    data: listData,
    loading: listLoading,
    error: listError,
  } = useQuery(GET_USER_ANIME_LIST, {
    variables: { userId },
    skip: !userId, // Apollo no ejecutará esta query hasta que userId tenga un valor
  });

  const handleLogout = () => {
    logout();
  };

  const [localScores, setLocalScores] = useState<Record<number, number>>({});

  useFocusEffect(
    React.useCallback(() => {
      const fetchScores = async () => {
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
      };
      fetchScores();
    }, []),
  );

  const renderAnimeItem = ({ item }: any) => {
    const anime = item.media;
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
        className="flex-row bg-white dark:bg-zinc-900 rounded-2xl mb-4 overflow-hidden shadow-sm dark:shadow-lg border border-zinc-200 dark:border-zinc-800"
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
          source={{ uri: anime.coverImage.large }}
          className="w-24 h-36 bg-zinc-200 dark:bg-zinc-800"
          resizeMode="cover"
        />
        <View className="flex-1 p-4 justify-center">
          <Text className="text-zinc-900 dark:text-white font-bold text-lg mb-1" numberOfLines={2}>
            {anime.title.romaji}
          </Text>
          <Text className="text-zinc-500 dark:text-zinc-400 text-sm mb-3">
            {statusTranslate[item.status] || item.status} •{' '}
            {anime.episodes ? `${anime.episodes} eps` : '? eps'}
          </Text>
          <View className="flex-row items-center justify-between">
            {displayScore > 0 ? (
              <View
                className={`px-3 py-1 rounded-full border ${hasLocal ? 'bg-blue-600/20 border-blue-500/30' : 'bg-green-600/20 border-green-500/30'}`}
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

  const isLoading = viewerLoading || listLoading;
  const error = viewerError || listError;

  const animeList = listData?.Page?.mediaList || [];

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
              source={{ uri: viewerData.Viewer.avatar.large }}
              className="w-12 h-12 rounded-full border-2 border-blue-500"
            />
          ) : (
            <View className="w-12 h-12 rounded-full bg-zinc-800" />
          )}
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-between items-end mb-6">
        <Text className="text-xl font-bold text-zinc-800 dark:text-white">Actividad Reciente</Text>
      </View>

      {/* LISTADO */}
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
        <FlatList
          data={animeList}
          keyExtractor={(item) => item.media.id.toString()}
          renderItem={renderAnimeItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
