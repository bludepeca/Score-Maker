import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import CriterionCard from '../components/CriterionCard';
import CriteriaSlider from '../components/CriteriaSlider';
import { calculateFinalScore, Criterion, DEFAULT_PACKS } from '../utils/calculator';
import { db } from '../db';
import { scores, syncQueue } from '../db/schema';
import { processSyncQueue } from '../services/syncService';
import { useMutation } from '@apollo/client/react';
import { SAVE_MEDIA_LIST_ENTRY } from '../api/queries';
import { eq } from 'drizzle-orm';

export default function RatingScreen({ route, navigation }: any) {
  const initialCriteria = DEFAULT_PACKS.find((p) => p.id === 'anime_general')?.criteria || [];

  const [criteria, setCriteria] = useState<Criterion[]>(initialCriteria);
  const [finalScore, setFinalScore] = useState(0);
  const [mode, setMode] = useState<'wizard' | 'summary'>('wizard');
  const [currentIndex, setCurrentIndex] = useState(0);

  const [saveToAnilist, { loading: savingToAnilist }] = useMutation(SAVE_MEDIA_LIST_ENTRY);

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentAnimeId = route.params?.animeId || 1;
        const currentPackId = route.params?.packId || 'anime_general';

        // 1. Fetch current pack criteria
        const { criteriaItems } = require('../db/schema');
        const itemRows = await db
          .select()
          .from(criteriaItems)
          .where(eq(criteriaItems.packId, currentPackId));
        let packCriteria = itemRows.map((i: any) => ({
          id: i.id,
          name: i.name,
          description: i.description || '',
          weight: i.weight,
          score: 0,
          scoreExplanations: i.scoreExplanations ? JSON.parse(i.scoreExplanations) : {},
        }));

        // 2. Load existing score and merge
        const existing = await db.select().from(scores).where(eq(scores.animeId, currentAnimeId));
        if (existing.length > 0) {
          const loadedCriteria = JSON.parse(existing[0].breakdown);
          packCriteria = packCriteria.map((pc: any) => {
            const oldMatch = loadedCriteria.find((lc: any) => lc.name === pc.name);
            if (oldMatch) {
              return { ...pc, score: oldMatch.score };
            }
            return pc;
          });
        }

        // 3. Sort by weight descending
        packCriteria.sort((a: any, b: any) => b.weight - a.weight);

        setCriteria(packCriteria);
      } catch (e) {
        console.error('Error loading data:', e);
      }
    };
    loadData();
  }, [route.params?.animeId, route.params?.packId]);

  useEffect(() => {
    try {
      const score = calculateFinalScore(criteria);
      setFinalScore(score);
    } catch (e) {
      console.warn(e);
    }
  }, [criteria]);

  const updateScore = (id: number | string, newScore: number) => {
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, score: newScore } : c)));
  };

  const handleNext = () => {
    if (currentIndex === criteria.length - 1) {
      setMode('summary');
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleEdit = (index: number) => {
    setCurrentIndex(index);
    setMode('wizard');
  };

  const handleSave = async () => {
    try {
      const currentAnimeId = route.params?.animeId || 1;

      // 1. Intentar guardar en AniList directamente
      try {
        await saveToAnilist({
          variables: {
            mediaId: currentAnimeId,
            scoreRaw: finalScore,
          },
        });
        console.log('Guardado en AniList correctamente.');
      } catch (anilistError) {
        console.error('Error guardando en AniList:', anilistError);
        Alert.alert(
          'Error de conexión',
          'No se pudo guardar la nota en AniList en este momento. Se intentará sincronizar más tarde.',
        );
      }

      // 2. Guardar en SQLite local
      const existing = await db.select().from(scores).where(eq(scores.animeId, currentAnimeId));
      if (existing.length > 0) {
        await db
          .update(scores)
          .set({
            calculatedScore: finalScore,
            finalScore: finalScore,
            breakdown: JSON.stringify(criteria),
          })
          .where(eq(scores.animeId, currentAnimeId));
      } else {
        await db.insert(scores).values({
          animeId: currentAnimeId,
          calculatedScore: finalScore,
          finalScore: finalScore,
          breakdown: JSON.stringify(criteria),
          createdAt: new Date(),
        });
      }

      // 3. Cola de sincronización para Supabase/Fallbacks
      await db.insert(syncQueue).values({
        action: 'SAVE_SCORE',
        payload: JSON.stringify({ animeId: currentAnimeId, finalScore, breakdown: criteria }),
        createdAt: new Date(),
      });

      processSyncQueue(); // Fire and forget

      navigation.goBack();
    } catch (error) {
      console.error('Error guardando localmente:', error);
    }
  };

  const activeCriterion = criteria[currentIndex];

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      {/* HEADER */}
      <View className="pt-4 px-6 pb-2 flex-row justify-between items-center bg-zinc-50 dark:bg-zinc-950">
        <Text
          className="text-2xl font-bold text-zinc-900 dark:text-white max-w-[80%]"
          numberOfLines={1}
        >
          {mode === 'wizard' ? 'Evaluación' : route.params?.animeTitle || 'Resumen Final'}
        </Text>
        {mode === 'wizard' ? (
          <TouchableOpacity onPress={() => setMode('summary')}>
            <Text className="text-blue-500 font-bold">Saltar al final</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      {/* BODY */}
      {mode === 'wizard' ? (
        <View className="flex-1">
          {activeCriterion && (
            <CriterionCard
              key={activeCriterion.id}
              name={activeCriterion.name}
              description={activeCriterion.description || ''}
              weight={activeCriterion.weight}
              score={activeCriterion.score}
              scoreExplanations={activeCriterion.scoreExplanations}
              onScoreChange={(val) => updateScore(activeCriterion.id, val)}
              onNext={handleNext}
              onBack={() => setCurrentIndex((prev) => prev - 1)}
              hasBack={currentIndex > 0}
              isLast={currentIndex === criteria.length - 1}
            />
          )}
        </View>
      ) : (
        <ScrollView className="p-4 flex-1">
          {criteria.map((c, index) => (
            <CriteriaSlider
              key={c.id}
              name={c.name}
              description={c.description}
              weight={c.weight}
              score={c.score}
              scoreExplanations={c.scoreExplanations}
              onScoreChange={(val) => updateScore(c.id, val)}
              onEdit={() => handleEdit(index)}
            />
          ))}
          <View className="h-32" />
        </ScrollView>
      )}

      {/* BOTTOM BAR */}
      <View className="bg-white dark:bg-zinc-900 p-6 border-t border-zinc-200 dark:border-zinc-800 flex-row justify-between items-center absolute bottom-0 left-0 right-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-none">
        <View>
          <Text className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs mb-1">
            Nota Final
          </Text>
          <Text className="text-3xl font-extrabold text-zinc-900 dark:text-white">
            {finalScore} <Text className="text-zinc-500 text-lg">/ 100</Text>
          </Text>
        </View>
        {mode === 'summary' && (
          <TouchableOpacity
            className={`px-8 py-4 rounded-xl shadow-lg ${savingToAnilist ? 'bg-zinc-700' : 'bg-blue-600 shadow-blue-500/30'}`}
            onPress={handleSave}
            disabled={savingToAnilist}
          >
            <Text className="text-white font-bold text-lg">
              {savingToAnilist ? 'Guardando...' : 'Guardar'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
