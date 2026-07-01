import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { getOrSeedPacks } from '../services/packService';

export default function AnimeDetailScreen({ route, navigation }: any) {
  const { anime, hasLocal, displayScore } = route.params;
  const [packs, setPacks] = useState<any[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const rows = await getOrSeedPacks();
        const validPacks = rows.filter((pack) => {
          let typeMatch = true;
          let genreMatch = true;

          if (pack.targetTypes) {
            const types = JSON.parse(pack.targetTypes);
            if (types.length > 0) {
              typeMatch = types.includes(anime.type);
            }
          }

          if (pack.targetGenres) {
            const genres = JSON.parse(pack.targetGenres);
            if (genres.length > 0) {
              genreMatch = genres.some((g: string) => anime.genres?.includes(g));
            }
          }

          return typeMatch && genreMatch;
        });

        setPacks(validPacks);
        const defaultPack = validPacks.find((p) => p.isDefault) || validPacks[0];
        if (defaultPack) {
          setSelectedPackId(defaultPack.id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchPacks();
  }, []);

  const handleStartRating = () => {
    navigation.navigate('Rating', {
      animeId: anime.id,
      animeTitle: anime.title.romaji,
      packId: selectedPackId,
    });
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <ScrollView className="flex-1">
        <View className="relative w-full h-72 bg-zinc-200 dark:bg-zinc-900">
          {anime.bannerImage ? (
            <Image
              source={{ uri: anime.bannerImage }}
              className="absolute w-full h-full opacity-60"
              resizeMode="cover"
            />
          ) : (
            <Image
              source={{ uri: anime.coverImage.large }}
              className="absolute w-full h-full opacity-40 blur-sm"
              resizeMode="cover"
            />
          )}
          <View className="absolute top-12 left-6 bg-black/50 rounded-full px-4 py-2">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text className="text-white font-bold">← Volver</Text>
            </TouchableOpacity>
          </View>
          <View className="absolute bottom-[-40] left-6 flex-row items-end">
            <Image
              source={{ uri: anime.coverImage.large }}
              className="w-28 h-40 rounded-xl border-4 border-zinc-50 dark:border-zinc-950 bg-zinc-300 dark:bg-zinc-800"
            />
            <View className="ml-4 pb-2 flex-1">
              <Text className="text-2xl font-black text-zinc-900 dark:text-white" numberOfLines={2}>
                {anime.title.romaji}
              </Text>
              <Text className="text-zinc-600 dark:text-zinc-400 font-medium">
                {anime.episodes ? `${anime.episodes} Episodios` : 'Emisión'} • {anime.status}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-16 px-6 pb-6">
          <View className="flex-row items-center justify-between mb-8">
            <View>
              <Text className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs">
                Puntaje Actual
              </Text>
              <Text className="text-4xl font-black text-zinc-900 dark:text-white">
                {displayScore !== undefined ? displayScore : '--'}
              </Text>
            </View>
            {hasLocal && (
              <View className="bg-blue-100 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900/50">
                <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs">
                  Nota Local (ScoreMaker)
                </Text>
              </View>
            )}
          </View>

          {!!anime.description && (
            <View className="mb-8">
              <Text className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs mb-2">
                Sinopsis
              </Text>
              <Text className="text-zinc-800 dark:text-zinc-300 leading-relaxed" numberOfLines={4}>
                {anime.description.replace(/<[^>]+>/g, '')}
              </Text>
            </View>
          )}

          <Text className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs mb-3">
            Elige el Criterio de Evaluación
          </Text>

          <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
            {packs.length === 0 ? (
              <View className="p-4">
                <Text className="text-zinc-500">Cargando packs...</Text>
              </View>
            ) : (
              packs.map((pack, index) => {
                const isSelected = selectedPackId === pack.id;
                return (
                  <TouchableOpacity
                    key={pack.id}
                    onPress={() => setSelectedPackId(pack.id)}
                    className={`p-4 flex-row justify-between items-center ${index !== packs.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800/50' : ''} ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                  >
                    <View className="flex-1 pr-2">
                      <Text
                        className={`font-bold text-lg ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-800 dark:text-zinc-200'}`}
                      >
                        {pack.name}
                      </Text>
                      {!!pack.description && (
                        <Text className="text-zinc-500 dark:text-zinc-500 text-sm">
                          {pack.description}
                        </Text>
                      )}
                    </View>
                    <View
                      className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-zinc-300 dark:border-zinc-600'}`}
                    >
                      {isSelected && <View className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      <View className="p-6 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900">
        <TouchableOpacity
          className={`py-4 rounded-xl items-center shadow-lg ${!selectedPackId ? 'bg-zinc-300 dark:bg-zinc-800' : 'bg-blue-600 shadow-blue-500/30'}`}
          disabled={!selectedPackId}
          onPress={handleStartRating}
        >
          <Text
            className={`font-black text-lg uppercase tracking-wider ${!selectedPackId ? 'text-zinc-500 dark:text-zinc-500' : 'text-white'}`}
          >
            {hasLocal ? 'Editar Evaluación' : 'Comenzar Evaluación'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
