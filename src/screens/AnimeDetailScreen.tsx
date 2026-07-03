import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getOrSeedPacks } from '../services/packService';
import { processSyncQueue } from '../services/syncService';

export default function AnimeDetailScreen({ route, navigation }: any) {
  const { anime, hasLocal, displayScore } = route.params;
  const [packs, setPacks] = useState<any[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [originalPackIdUsed, setOriginalPackIdUsed] = useState<string | null>(null);
  const [hasMismatch, setHasMismatch] = useState(false);
  const [currentLocalScore, setCurrentLocalScore] = useState(displayScore);
  const [hasLocalScore, setHasLocalScore] = useState(hasLocal);
  const [isSyncing, setIsSyncing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchPacks = async () => {
        try {
          const { db } = await import('../db');
          const { scores } = await import('../db/schema');
          const { eq } = await import('drizzle-orm');

          const existingScore = await db.select().from(scores).where(eq(scores.animeId, anime.id));
          let previousPackId: string | null = null;
          let previousPackSnapshot: any = null;

          if (existingScore.length > 0) {
            const scoreRecord = existingScore[0];
            previousPackId = scoreRecord.packId;
            setCurrentLocalScore(scoreRecord.finalScore);
            setHasLocalScore(true);
            if (scoreRecord.packSnapshot) {
              try {
                previousPackSnapshot = JSON.parse(scoreRecord.packSnapshot);
              } catch (e) {
                console.error('Error parsing packSnapshot:', e);
              }
            }
          }

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

          let displayPacks = [...validPacks];
          let snapshotIsOld = false;

          if (previousPackSnapshot) {
            const localPack = displayPacks.find((p) => p.id === previousPackSnapshot.id);
            if (!localPack) {
              snapshotIsOld = true;
            } else {
              const snapDate = new Date(previousPackSnapshot.updatedAt || 0).getTime();
              const localDate = new Date(localPack.updatedAt || 0).getTime();
              if (localDate > snapDate) {
                snapshotIsOld = true;
              }
            }

            if (snapshotIsOld) {
              const pseudoPack = {
                ...previousPackSnapshot,
                id: `snapshot_${previousPackSnapshot.id}`,
                isPseudo: true,
                name: `${previousPackSnapshot.name} (Versión Usada)`,
              };
              displayPacks = [pseudoPack, ...displayPacks];
            }
          }

          let initialSelectedId: string | null | undefined = displayPacks[0]?.id;
          let originalId: string | null = null;

          if (previousPackSnapshot) {
            if (snapshotIsOld) {
              initialSelectedId = `snapshot_${previousPackSnapshot.id}`;
              originalId = initialSelectedId;
            } else {
              initialSelectedId = previousPackId;
              originalId = initialSelectedId;
            }
          } else if (previousPackId) {
            initialSelectedId = previousPackId;
            originalId = initialSelectedId;
          } else {
            const found = displayPacks.find((p) => p.isDefault);
            if (found) initialSelectedId = found.id;
          }

          if (initialSelectedId) {
            const selectedIndex = displayPacks.findIndex((p) => p.id === initialSelectedId);
            if (selectedIndex > 0) {
              const selectedItem = displayPacks.splice(selectedIndex, 1)[0];
              displayPacks.unshift(selectedItem);
            }
          }

          setPacks(displayPacks);
          setSelectedPackId(initialSelectedId || null);
          setOriginalPackIdUsed(originalId || null);
        } catch (e) {
          console.error(e);
        }
      };
      fetchPacks();
    }, [anime.id]),
  );

  useEffect(() => {
    if (originalPackIdUsed && selectedPackId && originalPackIdUsed !== selectedPackId) {
      setHasMismatch(true);
    } else {
      setHasMismatch(false);
    }
  }, [selectedPackId, originalPackIdUsed]);

  const handleSyncScore = async () => {
    setIsSyncing(true);
    try {
      const { db } = await import('../db');
      const { scores, syncQueue } = await import('../db/schema');
      const { eq } = await import('drizzle-orm');

      const existingScore = await db.select().from(scores).where(eq(scores.animeId, anime.id));
      if (existingScore.length > 0) {
        await db.insert(syncQueue).values({
          action: 'SAVE_SCORE',
          payload: JSON.stringify({
            animeId: anime.id,
            finalScore: existingScore[0].finalScore,
            breakdown: JSON.parse(existingScore[0].breakdown),
            packId: existingScore[0].packId,
            packSnapshot: existingScore[0].packSnapshot,
          }),
          createdAt: new Date(),
        });
        await processSyncQueue();
        // Since we pushed successfully, we assume AniList is synced (optimistic UI)
        // Wait, AniList score requires refetching to update the API state, but we can just fake it or leave it as mismatched until pull.
        // Actually, just let the user know it was pushed.
        alert('Sincronización enviada a AniList. Refresca la lista para ver los cambios.');
      }
    } catch (error) {
      console.error(error);
    }
    setIsSyncing(false);
  };

  const handleStartRating = () => {
    const selectedPack = packs.find((p) => p.id === selectedPackId);
    if (!selectedPack) return;

    // React Navigation warns if we pass non-serializable values (like Date objects)
    const serializablePack = {
      ...selectedPack,
      updatedAt: selectedPack.updatedAt ? new Date(selectedPack.updatedAt).toISOString() : null,
    };

    navigation.navigate('Rating', {
      animeTitle: anime.title.romaji,
      animeId: anime.id,
      scoreFormat: anime.mediaListEntry?.scoreFormat,
      packData: serializablePack,
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
          <View className="absolute bottom-[-40] left-6 right-6 flex-row items-end">
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
              <Text
                className={`font-black text-zinc-900 dark:text-white ${currentLocalScore && currentLocalScore > 0 ? 'text-4xl' : 'text-2xl mt-2'}`}
              >
                {currentLocalScore && currentLocalScore > 0 ? currentLocalScore : 'Sin puntuar'}
              </Text>
            </View>

            {hasLocalScore && currentLocalScore !== (anime.mediaListEntry?.score || 0) && (
              <TouchableOpacity
                onPress={handleSyncScore}
                disabled={isSyncing}
                className="flex-row items-center bg-orange-100 dark:bg-orange-900/30 px-4 py-2 rounded-xl border border-orange-200 dark:border-orange-800"
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#ea580c" />
                ) : (
                  <>
                    <Text className="text-orange-600 dark:text-orange-400 mr-2 text-lg">☁️</Text>
                    <View>
                      <Text className="text-orange-700 dark:text-orange-300 font-bold text-xs uppercase tracking-wider">
                        Desincronizado
                      </Text>
                      <Text className="text-orange-600 dark:text-orange-400 text-[10px]">
                        AniList: {anime.mediaListEntry?.score || 0}
                      </Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {!!anime.description && (
            <View className="mb-8 bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <Text className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px] mb-3">
                Sinopsis
              </Text>
              <Text
                className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm"
                numberOfLines={5}
              >
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
                    className="p-4 flex-row justify-between items-center"
                    style={[
                      index !== packs.length - 1 && detailStyles.packBorder,
                      isSelected && detailStyles.packSelected,
                    ]}
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

          {hasMismatch && (
            <View className="bg-orange-100 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800/50 mt-4 mx-2">
              <Text className="text-orange-800 dark:text-orange-300 font-bold mb-1">
                ⚠️ Atención
              </Text>
              <Text className="text-orange-700 dark:text-orange-400 text-sm leading-tight">
                Estás por evaluar usando un pack (o versión) distinto al original. Los puntajes de
                los criterios coincidentes se mantendrán, pero tu nota final cambiará.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="p-6 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900">
        <TouchableOpacity
          className="py-4 rounded-xl items-center"
          style={!selectedPackId ? detailStyles.btnDisabled : detailStyles.btnActive}
          disabled={!selectedPackId}
          onPress={handleStartRating}
        >
          <Text
            className={`font-black text-lg uppercase tracking-wider ${!selectedPackId ? 'text-zinc-500 dark:text-zinc-500' : 'text-white'}`}
          >
            {hasLocalScore ? 'Editar Evaluación' : 'Comenzar Evaluación'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles extracted from NativeWind conditional template literals to avoid
// the CSS interop race condition (GitHub: nativewind#1536).
const detailStyles = StyleSheet.create({
  packBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(161, 161, 170, 0.15)', // zinc-100 approx
  },
  packSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)', // blue-50 approx
  },
  btnActive: {
    backgroundColor: '#2563eb', // blue-600
    shadowColor: 'rgba(59, 130, 246, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  btnDisabled: {
    backgroundColor: '#d4d4d8', // zinc-300
  },
});
