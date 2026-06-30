import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useQuery } from '@apollo/client/react';
import { GET_VIEWER, GET_USER_ANIME_LIST } from '../api/queries';

export default function HomeScreen({ navigation }: any) {
  const logout = useAuthStore((state) => state.logout);

  // 1. Obtener los datos del usuario actual
  const { data: viewerData, loading: viewerLoading, error: viewerError } = useQuery(GET_VIEWER);

  // 2. Extraer el userId dinámicamente de la respuesta
  const userId = viewerData?.Viewer?.id;

  // 3. Obtener su lista de animes (recientes en general), SOLO si ya tenemos el userId
  const { data: listData, loading: listLoading, error: listError } = useQuery(GET_USER_ANIME_LIST, {
    variables: { userId },
    skip: !userId, // Apollo no ejecutará esta query hasta que userId tenga un valor
  });

  const handleLogout = () => {
    logout();
  };

  const renderAnimeItem = ({ item }: any) => {
    const anime = item.media;
    const statusTranslate: Record<string, string> = {
      CURRENT: 'Viendo',
      COMPLETED: 'Completado',
      PAUSED: 'Pausado',
      DROPPED: 'Abandonado',
      PLANNING: 'Planeado'
    };

    return (
      <TouchableOpacity
        className="flex-row bg-zinc-900 rounded-2xl mb-4 overflow-hidden shadow-lg border border-zinc-800"
        onPress={() => navigation.navigate('Rating', { animeId: anime.id, animeTitle: anime.title.romaji, packId: 'anime_general' })}
      >
        <Image
          source={{ uri: anime.coverImage.large }}
          className="w-24 h-36 bg-zinc-800"
          resizeMode="cover"
        />
        <View className="flex-1 p-4 justify-center">
          <Text className="text-white font-bold text-lg mb-1" numberOfLines={2}>
            {anime.title.romaji}
          </Text>
          <Text className="text-zinc-400 text-sm mb-3">
            {statusTranslate[item.status] || item.status} • {anime.episodes ? `${anime.episodes} eps` : '? eps'}
          </Text>
          <View className="bg-blue-600/20 self-start px-3 py-1 rounded-full border border-blue-500/30">
            <Text className="text-blue-400 font-bold text-xs">Puntuar ahora</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const isLoading = viewerLoading || listLoading;
  const error = viewerError || listError;
  
  const animeList = listData?.Page?.mediaList || [];

  return (
    <View className="flex-1 bg-zinc-950 p-6 pt-12">
      {/* HEADER */}
      <View className="flex-row justify-between items-center mb-8">
        <View>
          <Text className="text-zinc-400 font-bold uppercase tracking-wider text-xs mb-1">
            Bienvenido
          </Text>
          <Text className="text-3xl font-black text-white">
            {viewerData?.Viewer?.name || 'Cargando...'}
          </Text>
        </View>
        {viewerData?.Viewer?.avatar?.large ? (
          <Image
            source={{ uri: viewerData.Viewer.avatar.large }}
            className="w-12 h-12 rounded-full border-2 border-blue-500"
          />
        ) : (
          <View className="w-12 h-12 rounded-full bg-zinc-800" />
        )}
      </View>

      <View className="flex-row justify-between items-end mb-6">
        <Text className="text-xl font-bold text-white">Actividad Reciente</Text>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity 
            onPress={() => navigation.navigate('CriteriaBuilder')}
            className="bg-zinc-800 p-2 rounded-full border border-zinc-700"
          >
            <Text className="text-lg">⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text className="text-red-500 font-bold">Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
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
