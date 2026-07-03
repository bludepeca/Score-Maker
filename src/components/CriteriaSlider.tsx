import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';

interface CriteriaSliderProps {
  name: string;
  description?: string;
  weight: number;
  score: number;
  scoreExplanations?: Record<number, string>;
  onScoreChange: (val: number) => void;
  onEdit?: () => void;
}

export default function CriteriaSlider({
  name,
  description,
  weight,
  score,
  scoreExplanations,
  onScoreChange,
  onEdit,
}: CriteriaSliderProps) {
  const getExplanation = () => {
    if (!scoreExplanations) return null;
    const keys = Object.keys(scoreExplanations)
      .map(Number)
      .sort((a, b) => b - a);
    for (const key of keys) {
      if (score >= key) {
        return scoreExplanations[key];
      }
    }
    return null;
  };

  const currentExplanation = getExplanation();

  return (
    <TouchableOpacity
      className="bg-zinc-800 p-4 rounded-xl mb-3 border border-zinc-700"
      onPress={onEdit}
      activeOpacity={0.8}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 pr-2">
          <Text className="text-white font-bold text-lg">{name}</Text>
          {!!description && <Text className="text-zinc-400 text-xs">{description}</Text>}
        </View>
        <Text className="text-blue-400 font-bold">{weight}%</Text>
      </View>

      {!!currentExplanation && (
        <Text className="text-blue-300 italic text-sm mb-3">"{currentExplanation}"</Text>
      )}

      <View className="flex-row items-center mt-2">
        <TouchableOpacity
          onPress={() => onScoreChange(Math.max(0, score - 1))}
          className="w-8 h-8 items-center justify-center bg-zinc-700 rounded-full"
        >
          <Text className="font-bold text-lg text-zinc-400">-</Text>
        </TouchableOpacity>

        <View className="flex-1 px-2">
          <Slider
            style={{ width: '100%', height: 30 }}
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={score}
            onValueChange={onScoreChange}
            minimumTrackTintColor="#3b82f6"
            maximumTrackTintColor="#3f3f46"
            thumbTintColor="#60a5fa"
          />
        </View>

        <TouchableOpacity
          onPress={() => onScoreChange(Math.min(10, score + 1))}
          className="w-8 h-8 items-center justify-center bg-zinc-700 rounded-full"
        >
          <Text className="font-bold text-lg text-zinc-400">+</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-center text-white mt-1 font-bold text-xl">{score} / 10</Text>
    </TouchableOpacity>
  );
}
