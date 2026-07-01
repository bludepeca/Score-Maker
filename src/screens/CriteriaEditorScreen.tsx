import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { db } from '../db';
import { criteriaPacks, criteriaItems } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';

export default function CriteriaEditorScreen({ route, navigation }: any) {
  const { packId } = route?.params || {};

  const [packName, setPackName] = useState('');
  const [packDescription, setPackDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [targetTypes, setTargetTypes] = useState<string[]>([]);
  const [targetGenres, setTargetGenres] = useState<string[]>([]);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'sliders' | 'manual'>('sliders');

  // Modal State for Explanations
  const [explModalVisible, setExplModalVisible] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  // Modal State for Tags
  const [tagsModalVisible, setTagsModalVisible] = useState(false);

  useEffect(() => {
    const loadPack = async () => {
      if (packId) {
        const packRows = await db.select().from(criteriaPacks).where(eq(criteriaPacks.id, packId));
        if (packRows.length > 0) {
          const pack = packRows[0];
          setPackName(pack.name);
          setPackDescription(pack.description || '');
          setIsDefault(pack.isDefault || false);
          setTargetTypes(pack.targetTypes ? JSON.parse(pack.targetTypes) : []);
          setTargetGenres(pack.targetGenres ? JSON.parse(pack.targetGenres) : []);

          const itemRows = await db
            .select()
            .from(criteriaItems)
            .where(eq(criteriaItems.packId, packId));
          const parsedItems = itemRows
            .map((i) => ({
              ...i,
              scoreExplanations: i.scoreExplanations ? JSON.parse(i.scoreExplanations) : {},
              _localId: i.id,
              weight: Number(i.weight),
            }))
            .sort((a, b) => a.order - b.order);
          setItems(parsedItems);
        }
      } else {
        setItems([
          { _localId: Crypto.randomUUID(), name: 'Historia', weight: 50, scoreExplanations: {} },
          { _localId: Crypto.randomUUID(), name: 'Animación', weight: 50, scoreExplanations: {} },
        ]);
      }
      setLoading(false);
    };
    loadPack();
  }, [packId]);

  const currentTotal = items.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  const isValid = currentTotal === 100 && packName.trim() !== '' && items.length > 0;

  const handleAddItem = () => {
    setItems([
      ...items,
      { _localId: Crypto.randomUUID(), name: 'Nuevo Criterio', weight: 0, scoreExplanations: {} },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleChangeItemText = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSliderChange = (index: number, val: number) => {
    let newItems = [...items];
    const oldVal = newItems[index].weight;
    const diff = val - oldVal;

    if (diff === 0) return;

    newItems[index].weight = val;

    // Distribute remaining (100 - val) among others
    const remainingNeeded = 100 - val;

    const otherItems = newItems
      .map((item, idx) => ({ ...item, idx }))
      .filter((it) => it.idx !== index);

    if (otherItems.length === 0) {
      setItems(newItems);
      return;
    }

    const sumOthers = otherItems.reduce((acc, it) => acc + it.weight, 0);

    if (sumOthers === 0) {
      // distribute equally
      const share = Math.floor(remainingNeeded / otherItems.length);
      otherItems.forEach((it) => {
        newItems[it.idx].weight = share;
      });
    } else {
      // distribute proportionally
      otherItems.forEach((it) => {
        const proportion = it.weight / sumOthers;
        newItems[it.idx].weight = Math.round(remainingNeeded * proportion);
      });
    }

    // Fix rounding to exactly 100
    const newTotal = newItems.reduce((acc, it) => acc + it.weight, 0);
    if (newTotal !== 100) {
      // Find largest other item to absorb rounding diff
      const maxOther = otherItems.reduce(
        (max, it) => (newItems[it.idx].weight > newItems[max.idx].weight ? it : max),
        otherItems[0],
      );
      newItems[maxOther.idx].weight += 100 - newTotal;
      if (newItems[maxOther.idx].weight < 0) {
        newItems[maxOther.idx].weight = 0;
      }
    }

    setItems(newItems);
  };

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert(
        'Error',
        'Asegúrate de que la suma total sea exactamente 100% y que el pack tenga nombre.',
      );
      return;
    }

    try {
      const finalPackId = packId || Crypto.randomUUID();

      if (!packId) {
        await db.insert(criteriaPacks).values({
          id: finalPackId,
          name: packName,
          description: packDescription,
          isDefault: false,
          targetTypes: JSON.stringify(targetTypes),
          targetGenres: JSON.stringify(targetGenres),
        });
      } else {
        await db
          .update(criteriaPacks)
          .set({
            name: packName,
            description: packDescription,
            targetTypes: JSON.stringify(targetTypes),
            targetGenres: JSON.stringify(targetGenres),
          })
          .where(eq(criteriaPacks.id, finalPackId));
      }

      await db.delete(criteriaItems).where(eq(criteriaItems.packId, finalPackId));

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await db.insert(criteriaItems).values({
          id: Crypto.randomUUID(),
          packId: finalPackId,
          name: item.name,
          description: item.description || '',
          weight: item.weight,
          scoreExplanations:
            Object.keys(item.scoreExplanations).length > 0
              ? JSON.stringify(item.scoreExplanations)
              : null,
          order: i,
        });
      }

      Alert.alert('Éxito', 'Pack guardado correctamente.', [
        { text: 'OK', onPress: () => navigation?.goBack() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Hubo un problema guardando el pack.');
    }
  };

  const toggleType = (type: string) => {
    if (targetTypes.includes(type)) setTargetTypes(targetTypes.filter((t) => t !== type));
    else setTargetTypes([...targetTypes, type]);
  };

  if (loading) return <View className="flex-1 bg-zinc-50 dark:bg-zinc-950" />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
    >
      <View className="pt-12 px-6 pb-4 flex-row justify-between items-center bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <Text className="text-blue-600 dark:text-blue-500 font-bold">Cancelar</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-zinc-900 dark:text-white">
          {packId ? 'Editar Pack' : 'Nuevo Pack'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!isValid}
          className={isValid ? 'opacity-100' : 'opacity-50'}
        >
          <Text className="text-blue-600 dark:text-blue-500 font-bold">Guardar</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar Header */}
      <View className="px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm z-10">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-zinc-600 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider">
            Total de Pesos
          </Text>
          <Text
            className={`font-black text-xl ${currentTotal === 100 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {currentTotal}%
          </Text>
        </View>
        <View className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <View
            className={`h-full ${currentTotal === 100 ? 'bg-green-500' : currentTotal > 100 ? 'bg-red-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min(currentTotal, 100)}%` }}
          />
        </View>
        {currentTotal !== 100 && (
          <Text className="text-red-500 text-xs mt-2 font-medium">
            La suma debe ser exactamente 100% para guardar.
          </Text>
        )}
      </View>

      <ScrollView
        className="flex-1 p-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 350 }}
      >
        {/* Toggle Mode */}
        <View className="flex-row bg-zinc-200 dark:bg-zinc-800 rounded-xl p-1 mb-6">
          <TouchableOpacity
            className={`flex-1 py-2 items-center rounded-lg ${mode === 'sliders' ? 'bg-white dark:bg-zinc-700 shadow-sm' : ''}`}
            onPress={() => setMode('sliders')}
          >
            <Text
              className={`font-bold ${mode === 'sliders' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
            >
              Sliders (100%)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 items-center rounded-lg ${mode === 'manual' ? 'bg-white dark:bg-zinc-700 shadow-sm' : ''}`}
            onPress={() => setMode('manual')}
          >
            <Text
              className={`font-bold ${mode === 'manual' ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}
            >
              Manual (%)
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs mb-2">
            Nombre del Pack
          </Text>
          <TextInput
            value={packName}
            onChangeText={setPackName}
            placeholder="Ej: Manga Shounen"
            placeholderTextColor="#a1a1aa"
            editable={!isDefault} // Prevents renaming the default pack
            className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-zinc-900 dark:text-white font-bold text-lg ${isDefault ? 'opacity-50' : ''}`}
          />
        </View>

        <View className="mb-6">
          <Text className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs mb-2">
            Visibilidad (Tags)
          </Text>
          <TouchableOpacity
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex-row justify-between items-center"
            onPress={() => setTagsModalVisible(true)}
          >
            <View className="flex-1">
              {targetTypes.length === 0 && targetGenres.length === 0 ? (
                <Text className="text-zinc-500 dark:text-zinc-400">
                  Mostrar en todos los animes/mangas
                </Text>
              ) : (
                <Text className="text-blue-600 dark:text-blue-400 font-bold" numberOfLines={1}>
                  {targetTypes.join(', ')}{' '}
                  {targetGenres.length > 0 ? `• ${targetGenres.join(', ')}` : ''}
                </Text>
              )}
            </View>
            <Text className="text-zinc-400 font-bold">Editar {'>'}</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-xs mb-4">
          Criterios
        </Text>

        {items.map((item, index) => (
          <View
            key={item._localId}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 mb-4 shadow-sm"
          >
            <View className="mb-3">
              <TextInput
                value={item.name}
                onChangeText={(t) => handleChangeItemText(index, 'name', t)}
                placeholder="Nombre (ej: Animación)"
                placeholderTextColor="#a1a1aa"
                className="text-zinc-900 dark:text-white font-bold text-lg mb-2"
              />
              <TextInput
                value={item.description}
                onChangeText={(t) => handleChangeItemText(index, 'description', t)}
                placeholder="Descripción opcional"
                placeholderTextColor="#a1a1aa"
                multiline
                style={{ minHeight: 60, textAlignVertical: 'top' }}
                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg p-3 text-zinc-700 dark:text-zinc-300 text-sm"
              />
            </View>

            <View className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 mb-3">
              {mode === 'sliders' ? (
                <View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider">
                      Porcentaje
                    </Text>
                    <Text className="text-blue-600 dark:text-blue-400 font-black">
                      {item.weight}%
                    </Text>
                  </View>
                  <Slider
                    style={{ width: '100%', height: 30 }}
                    minimumValue={0}
                    maximumValue={100}
                    step={1}
                    value={item.weight}
                    onValueChange={(val) => handleSliderChange(index, val)}
                    minimumTrackTintColor="#3b82f6"
                    maximumTrackTintColor="#3f3f46"
                    thumbTintColor="#60a5fa"
                  />
                </View>
              ) : (
                <View className="flex-row items-center justify-between">
                  <Text className="text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider">
                    Porcentaje Exacto
                  </Text>
                  <View className="flex-row items-center">
                    <TextInput
                      value={String(item.weight)}
                      onChangeText={(t) =>
                        handleChangeItemText(index, 'weight', t.replace(/[^0-9]/g, ''))
                      }
                      keyboardType="numeric"
                      maxLength={3}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 text-center text-zinc-900 dark:text-white font-bold text-lg w-20"
                    />
                    <Text className="text-zinc-400 text-lg font-bold ml-2">%</Text>
                  </View>
                </View>
              )}
            </View>

            <View className="flex-row justify-between items-center border-t border-zinc-100 dark:border-zinc-800/50 pt-3">
              <TouchableOpacity
                onPress={() => {
                  setActiveItemIndex(index);
                  setExplModalVisible(true);
                }}
              >
                <Text className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                  💬 Frases ({Object.keys(item.scoreExplanations).length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                <Text className="text-red-500 font-bold text-sm">Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity
          className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl py-6 items-center mb-10"
          onPress={handleAddItem}
        >
          <Text className="text-zinc-500 dark:text-zinc-400 font-bold text-lg">
            + Agregar Criterio
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Explanations Modal */}
      <Modal visible={explModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 pt-12">
          <View className="flex-row justify-between items-center mb-8">
            <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
              Frases de Puntuación
            </Text>
            <TouchableOpacity onPress={() => setExplModalVisible(false)}>
              <Text className="text-blue-600 dark:text-blue-500 font-bold">Cerrar</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
            Define qué significa cada nota para este criterio. Por ejemplo: "10" puede ser "Obra
            Maestra". Cuando el usuario deslice el slider a esa nota, verá esta frase.
          </Text>

          {activeItemIndex !== null && (
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 350 }}>
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map((score) => {
                const expl = items[activeItemIndex].scoreExplanations[score] || '';
                return (
                  <View key={score} className="flex-row items-center mb-3">
                    <View className="bg-zinc-200 dark:bg-zinc-800 w-12 h-12 rounded-xl items-center justify-center mr-3">
                      <Text className="text-zinc-900 dark:text-white font-black text-xl">
                        {score}
                      </Text>
                    </View>
                    <TextInput
                      value={expl}
                      onChangeText={(text) => {
                        const newItems = [...items];
                        if (text.trim() === '') {
                          delete newItems[activeItemIndex].scoreExplanations[score];
                        } else {
                          newItems[activeItemIndex].scoreExplanations[score] = text;
                        }
                        setItems(newItems);
                      }}
                      placeholder="Frase para esta nota..."
                      placeholderTextColor="#a1a1aa"
                      className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-zinc-900 dark:text-white font-medium shadow-sm"
                    />
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Tags Modal */}
      <Modal visible={tagsModalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white dark:bg-zinc-900 rounded-t-3xl p-6 min-h-[50%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
                Filtros del Pack
              </Text>
              <TouchableOpacity onPress={() => setTagsModalVisible(false)}>
                <Text className="text-blue-600 dark:text-blue-500 font-bold">Listo</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-zinc-500 dark:text-zinc-400 mb-4 text-sm">
              Selecciona en qué tipo de obras debe aparecer este pack. Si no seleccionas ninguno,
              aparecerá en todas.
            </Text>

            <Text className="text-zinc-900 dark:text-white font-bold mb-3 text-lg">
              Tipo de Obra
            </Text>
            <View className="flex-row gap-3 mb-6">
              {['ANIME', 'MANGA'].map((type) => {
                const active = targetTypes.includes(type);
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => toggleType(type)}
                    className={`px-4 py-2 rounded-full border ${active ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-zinc-300 dark:border-zinc-700'}`}
                  >
                    <Text
                      className={`font-bold ${active ? 'text-white' : 'text-zinc-700 dark:text-zinc-300'}`}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="text-zinc-900 dark:text-white font-bold mb-3 text-lg">
              Géneros (AniList)
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {[
                'Action',
                'Adventure',
                'Comedy',
                'Drama',
                'Ecchi',
                'Fantasy',
                'Horror',
                'Mecha',
                'Music',
                'Mystery',
                'Psychological',
                'Romance',
                'Sci-Fi',
                'Slice of Life',
                'Sports',
                'Supernatural',
                'Thriller',
              ].map((genre) => {
                const active = targetGenres.includes(genre);
                return (
                  <TouchableOpacity
                    key={genre}
                    onPress={() => {
                      if (active) setTargetGenres(targetGenres.filter((g) => g !== genre));
                      else setTargetGenres([...targetGenres, genre]);
                    }}
                    className={`px-3 py-1.5 rounded-full border ${active ? 'bg-blue-600 border-blue-600' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}`}
                  >
                    <Text
                      className={`font-medium text-sm ${active ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'}`}
                    >
                      {genre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
