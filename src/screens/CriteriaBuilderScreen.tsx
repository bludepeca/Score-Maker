import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { getOrSeedPacks } from '../services/packService';
import * as Clipboard from 'expo-clipboard';
import * as Crypto from 'expo-crypto';
import { db } from '../db';
import { criteriaPacks, criteriaItems, syncQueue } from '../db/schema';
import { eq } from 'drizzle-orm';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { processSyncQueue } from '../services/syncService';

export default function CriteriaBuilderScreen({ navigation }: any) {
  const [packs, setPacks] = useState<any[]>([]);

  const fetchPacks = async () => {
    try {
      const rows = await getOrSeedPacks();
      setPacks(rows);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPacks();
    }, []),
  );

  const handleCreateNew = () => {
    navigation.navigate('CriteriaEditor');
  };

  const handleDeletePack = (packId: string, packName: string) => {
    Alert.alert(
      'Eliminar Pack',
      `¿Estás seguro que deseas eliminar el pack "${packName}"? Esto no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.delete(criteriaItems).where(eq(criteriaItems.packId, packId));
              await db.delete(criteriaPacks).where(eq(criteriaPacks.id, packId));

              await db.insert(syncQueue).values({
                action: 'SYNC_CRITERIA',
                payload: JSON.stringify({ packId: packId }),
                createdAt: new Date(),
              });
              processSyncQueue();

              fetchPacks();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'No se pudo eliminar el pack.');
            }
          },
        },
      ],
    );
  };

  const handleImport = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (!text || text.trim().length === 0) {
        Alert.alert('Error', 'El portapapeles está vacío.');
        return;
      }

      let jsonString = text.trim();

      // Si viene con el prefijo base64, lo decodificamos
      if (text.startsWith('score-maker-pack://')) {
        const base64 = text.replace('score-maker-pack://', '');
        jsonString = decodeURIComponent(atob(base64));
      }

      let packData;
      try {
        packData = JSON.parse(jsonString);
      } catch (e) {
        Alert.alert('Error de formato', 'El contenido del portapapeles no es un JSON válido.');
        return;
      }

      // Validaciones estrictas
      if (!packData.packName || typeof packData.packName !== 'string') {
        Alert.alert('Error', 'El JSON debe contener un "packName" válido de tipo texto.');
        return;
      }
      if (!Array.isArray(packData.items) || packData.items.length === 0) {
        Alert.alert('Error', 'El JSON debe contener un arreglo "items" con al menos un criterio.');
        return;
      }

      let totalWeight = 0;
      for (let i = 0; i < packData.items.length; i++) {
        const item = packData.items[i];
        if (!item.name || typeof item.name !== 'string') {
          Alert.alert('Error', `El ítem #${i + 1} no tiene un "name" válido.`);
          return;
        }
        if (typeof item.weight !== 'number') {
          Alert.alert('Error', `El ítem "${item.name}" no tiene un "weight" (peso) numérico.`);
          return;
        }
        totalWeight += item.weight;
      }

      if (Math.abs(totalWeight - 100) > 0.01) {
        Alert.alert(
          'Error',
          `La suma de los pesos de los criterios debe dar exactamente 100%. Actualmente suma ${totalWeight}%.`,
        );
        return;
      }

      const newPackId = Crypto.randomUUID();

      await db.insert(criteriaPacks).values({
        id: newPackId,
        name: `${packData.packName} (Importado)`,
        description: packData.packDescription || '',
        isDefault: false,
        targetTypes: JSON.stringify(packData.targetTypes || []),
        targetGenres: JSON.stringify(packData.targetGenres || []),
      });

      for (let i = 0; i < packData.items.length; i++) {
        const item = packData.items[i];
        await db.insert(criteriaItems).values({
          id: Crypto.randomUUID(),
          packId: newPackId,
          name: item.name,
          description: item.description || '',
          weight: item.weight,
          scoreExplanations: item.scoreExplanations ? JSON.stringify(item.scoreExplanations) : null,
          order: i,
        });
      }

      await db.insert(syncQueue).values({
        action: 'SYNC_CRITERIA',
        payload: JSON.stringify({ packId: newPackId }),
        createdAt: new Date(),
      });
      processSyncQueue();

      Alert.alert('¡Éxito!', 'Pack importado correctamente.');
      fetchPacks();
    } catch (e) {
      console.error(e);
      Alert.alert('Error Crítico', 'Ocurrió un problema inesperado al importar el pack.');
    }
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 pt-12">
      <View className="flex-row justify-between items-center mb-8">
        <Text className="text-3xl font-black text-zinc-900 dark:text-white">Diseñar Criterios</Text>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={handleImport}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="download-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className="text-zinc-600 dark:text-zinc-400 font-bold">Volver</Text>
          </TouchableOpacity>
        </View>
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
              onLongPress={() => {
                if (!pack.isDefault) {
                  Alert.alert('Opciones del Pack', `¿Qué deseas hacer con "${pack.name}"?`, [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Editar',
                      onPress: () => navigation.navigate('CriteriaEditor', { packId: pack.id }),
                    },
                    {
                      text: 'Eliminar',
                      style: 'destructive',
                      onPress: () => handleDeletePack(pack.id, pack.name),
                    },
                  ]);
                }
              }}
              delayLongPress={400}
            >
              <View className="flex-1 mr-4">
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
