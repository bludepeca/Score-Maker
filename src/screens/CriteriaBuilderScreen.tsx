import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { getOrSeedPacks } from '../services/packService';

export default function CriteriaBuilderScreen({ navigation }: any) {
  const [packs, setPacks] = useState<any[]>([]);

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const rows = await getOrSeedPacks();
        setPacks(rows);
      } catch (e) {
        console.error(e);
      }
    };
    fetchPacks();
  }, []);

  const handleCreateNew = () => {
    // Alert.alert('Próximamente', 'Aquí se abrirá la pantalla para agregar y distribuir porcentajes de los criterios.');
    navigation.navigate('CriteriaEditor');
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 pt-12">
      <View className="flex-row justify-between items-center mb-8">
        <Text className="text-3xl font-black text-zinc-900 dark:text-white">Diseñar Criterios</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="text-blue-600 dark:text-blue-500 font-bold">Volver</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Text className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mb-4 text-xs">
          Tus Packs Actuales
        </Text>

        {packs.length === 0 ? (
          <View className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm items-center">
            <Text className="text-zinc-500 dark:text-zinc-400 text-center">
              No tienes packs personalizados aún.
            </Text>
          </View>
        ) : (
          packs.map((pack) => (
            <TouchableOpacity
              key={pack.id}
              className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-3 flex-row justify-between items-center shadow-sm"
              onPress={() => navigation.navigate('CriteriaEditor', { packId: pack.id })}
            >
              <View>
                <Text className="text-zinc-900 dark:text-white font-bold text-lg">{pack.name}</Text>
                {!!pack.description && (
                  <Text className="text-zinc-500 dark:text-zinc-400 text-sm">
                    {pack.description}
                  </Text>
                )}
              </View>
              {pack.isDefault ? (
                <View className="bg-blue-100 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900/50">
                  <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs">
                    Por defecto
                  </Text>
                </View>
              ) : (
                <Text className="text-zinc-400">{'>'}</Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        className="bg-blue-600 py-4 rounded-xl border border-blue-500 items-center mt-4 shadow-lg shadow-blue-500/30"
        onPress={handleCreateNew}
      >
        <Text className="text-white font-bold text-lg">+ Crear Nuevo Pack</Text>
      </TouchableOpacity>
    </View>
  );
}
