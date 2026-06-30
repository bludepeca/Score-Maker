import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export default function CriteriaBuilderScreen({ navigation }: any) {
  return (
    <View className="flex-1 bg-zinc-950 p-6 pt-12">
      <View className="flex-row justify-between items-center mb-8">
        <Text className="text-3xl font-black text-white">Diseñar Criterios</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-blue-500 font-bold">Cerrar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-xl mb-6 items-center">
          <Text className="text-6xl mb-4">🛠️</Text>
          <Text className="text-xl font-bold text-white text-center mb-2">
            Constructor en Desarrollo
          </Text>
          <Text className="text-zinc-400 text-center leading-relaxed">
            Aquí podrás crear tus propios "Packs de Criterios" (ej: Manga, Romance, Shounen), definir los porcentajes exactos de cada ítem, y escribir las frases personalizadas para cada nota.
          </Text>
        </View>

        <Text className="text-zinc-500 font-bold uppercase tracking-wider mb-4">
          Tus Packs Actuales (Solo Lectura)
        </Text>

        <View className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 mb-3 flex-row justify-between items-center">
          <View>
            <Text className="text-white font-bold text-lg">Anime General</Text>
            <Text className="text-zinc-400 text-sm">10 Criterios • 100%</Text>
          </View>
          <View className="bg-blue-500/20 px-3 py-1 rounded-full border border-blue-500/30">
            <Text className="text-blue-400 font-bold text-xs">Activo</Text>
          </View>
        </View>

        <View className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 mb-3 flex-row justify-between items-center opacity-50">
          <View>
            <Text className="text-white font-bold text-lg">Manga / Manhwa</Text>
            <Text className="text-zinc-400 text-sm">5 Criterios • 100%</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        className="bg-zinc-800 py-4 rounded-xl border border-zinc-700 items-center mt-4 opacity-50"
        disabled
      >
        <Text className="text-zinc-500 font-bold text-lg">+ Crear Nuevo Pack</Text>
      </TouchableOpacity>
    </View>
  );
}
