import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface CriterionCardProps {
  name: string;
  description: string;
  weight: number;
  score: number;
  scoreExplanations?: Record<number, string>;
  onScoreChange: (val: number) => void;
  onSlidingStart?: () => void;
  onSlidingComplete?: () => void;
  onNext: () => void;
  isLast: boolean;
}

export default function CriterionCard({
  name,
  description,
  weight,
  score,
  scoreExplanations,
  onScoreChange,
  onSlidingStart,
  onSlidingComplete,
  onNext,
  isLast
}: CriterionCardProps) {
  
  const handleValueChange = (val: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onScoreChange(val);
  };

  const getExplanation = () => {
    if (!scoreExplanations) return null;
    const keys = Object.keys(scoreExplanations).map(Number).sort((a, b) => b - a);
    for (const key of keys) {
      if (score >= key) {
        return scoreExplanations[key];
      }
    }
    return null;
  };

  const currentExplanation = getExplanation();

  return (
    <View style={{ width }} className="flex-1 items-center justify-center p-6">
      <View className="w-full bg-zinc-900 rounded-3xl p-8 border border-zinc-800 shadow-2xl">
        <View className="flex-row justify-between items-start mb-8">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-extrabold text-white mb-2">{name}</Text>
            {!!description && <Text className="text-zinc-400 text-base leading-relaxed">{description}</Text>}
          </View>
          <View className="bg-blue-600/20 px-4 py-2 rounded-full border border-blue-500/30">
            <Text className="text-blue-400 font-bold text-lg">{weight}%</Text>
          </View>
        </View>

        <View className="items-center justify-center py-6 mb-4">
          <Text className="text-[80px] font-black text-white tracking-tighter shadow-lg">
            {score}
          </Text>
          <Text className="text-zinc-500 font-bold uppercase tracking-widest mt-2">
            Puntuación
          </Text>
          {!!currentExplanation && (
            <Text className="text-blue-400 italic font-bold text-center mt-4 px-2">
              "{currentExplanation}"
            </Text>
          )}
        </View>

        <View className="mb-10 px-2">
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={score}
            onValueChange={handleValueChange}
            onSlidingStart={onSlidingStart}
            onSlidingComplete={onSlidingComplete}
            minimumTrackTintColor="#3b82f6"
            maximumTrackTintColor="#3f3f46"
            thumbTintColor="#60a5fa"
          />
          <View className="flex-row justify-between px-1 mt-2">
            <Text className="text-zinc-500 font-bold">0</Text>
            <Text className="text-zinc-500 font-bold">10</Text>
          </View>
        </View>

        <TouchableOpacity
          className="bg-blue-600 py-4 rounded-xl border border-blue-500 items-center shadow-lg shadow-blue-500/30"
          onPress={onNext}
        >
          <Text className="text-white font-black text-lg uppercase tracking-wider">
            {isLast ? 'Ver Resumen Final' : 'Siguiente'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
