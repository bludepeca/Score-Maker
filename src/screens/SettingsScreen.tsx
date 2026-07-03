import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore, ThemeType } from '../store/useThemeStore';

import { useColorScheme } from 'nativewind';

export default function SettingsScreen({ navigation }: any) {
  const logout = useAuthStore((state) => state.logout);
  const { theme, setTheme } = useThemeStore();
  const { colorScheme } = useColorScheme();

  const handleLogout = () => {
    logout();
  };

  const isDark = colorScheme === 'dark';

  const ThemeOption = ({ value, label }: { value: ThemeType; label: string }) => {
    const isSelected = theme === value;

    // Fix: Dynamically set background color based on theme and selection
    const backgroundColor = isSelected ? 'rgba(59, 130, 246, 0.1)' : isDark ? '#18181b' : '#ffffff'; // zinc-900 / white

    return (
      <TouchableOpacity
        onPress={() => setTheme(value)}
        className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex-row justify-between items-center"
        style={{ backgroundColor }}
      >
        <Text
          className={`font-medium ${isSelected ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-zinc-800 dark:text-zinc-200'}`}
        >
          {label}
        </Text>
        {isSelected && <Text className="text-blue-600 dark:text-blue-400">✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <View className="p-6">
        <Text className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mb-2 text-xs">
          Tema de la Aplicación
        </Text>
        <View className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 mb-8 shadow-sm">
          <ThemeOption value="system" label="Usar tema del sistema" />
          <ThemeOption value="light" label="Modo Claro" />
          <ThemeOption value="dark" label="Modo Oscuro" />
        </View>

        <Text className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mb-2 text-xs">
          Packs de Criterios
        </Text>
        <TouchableOpacity
          className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex-row justify-between items-center mb-8 shadow-sm"
          onPress={() => navigation.navigate('CriteriaBuilder')}
        >
          <Text className="text-zinc-800 dark:text-zinc-200 font-medium text-lg">
            🛠️ Diseñar Criterios
          </Text>
          <Text className="text-zinc-400">{'>'}</Text>
        </TouchableOpacity>

        <Text className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mb-2 text-xs">
          Cuenta
        </Text>
        <TouchableOpacity
          className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-900/30 items-center shadow-sm"
          onPress={handleLogout}
        >
          <Text className="text-red-600 dark:text-red-400 font-bold text-lg">Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const settingsStyles = StyleSheet.create({
  themeOptionDefault: {
    backgroundColor: '#ffffff', // bg-white (fallback)
  },
  themeOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // bg-blue-50/blue-900 approx
  },
});
