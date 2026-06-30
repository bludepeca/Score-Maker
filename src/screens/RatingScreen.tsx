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

export default function RatingScreen({ route, navigation }: any) {
  const initialCriteria = DEFAULT_PACKS.find(p => p.id === 'anime_general')?.criteria || [];

  const [criteria, setCriteria] = useState<Criterion[]>(initialCriteria);
  const [finalScore, setFinalScore] = useState(0);
  const [mode, setMode] = useState<'wizard' | 'summary'>('wizard');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [saveToAnilist, { loading: savingToAnilist }] = useMutation(SAVE_MEDIA_LIST_ENTRY);

  useEffect(() => {
    try {
      const score = calculateFinalScore(criteria);
      setFinalScore(score);
    } catch (e) {
      console.warn(e);
    }
  }, [criteria]);

  const updateScore = (id: number | string, newScore: number) => {
    setCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, score: newScore } : c))
    );
  };

  const handleNext = () => {
    if (currentIndex === criteria.length - 1) {
      setMode('summary');
    } else {
      setCurrentIndex(prev => prev + 1);
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
          }
        });
        console.log('Guardado en AniList correctamente.');
      } catch (anilistError) {
        console.error('Error guardando en AniList:', anilistError);
        Alert.alert('Error de conexión', 'No se pudo guardar la nota en AniList en este momento. Se intentará sincronizar más tarde.');
      }

      // 2. Guardar en SQLite local
      await db.insert(scores).values({
        animeId: currentAnimeId,
        calculatedScore: finalScore,
        finalScore: finalScore,
        breakdown: JSON.stringify(criteria),
        createdAt: new Date(),
      });

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
    <View className="flex-1 bg-zinc-950">
      
      {/* HEADER */}
      <View className="pt-4 px-6 pb-2 flex-row justify-between items-center bg-zinc-950">
        <Text className="text-2xl font-bold text-white">
          {mode === 'wizard' ? 'Evaluación' : 'Resumen Final'}
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
                isLast={currentIndex === criteria.length - 1}
              />
           )}
           {/* Botón de volver para mayor comodidad */}
           {currentIndex > 0 && (
             <TouchableOpacity 
               className="absolute bottom-10 left-6 p-4"
               onPress={() => setCurrentIndex(prev => prev - 1)}
             >
               <Text className="text-zinc-500 font-bold">Atrás</Text>
             </TouchableOpacity>
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
      <View className="bg-zinc-900 p-6 border-t border-zinc-800 flex-row justify-between items-center absolute bottom-0 left-0 right-0">
        <View>
          <Text className="text-zinc-400">Nota Final</Text>
          <Text className="text-3xl font-extrabold text-white">
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
