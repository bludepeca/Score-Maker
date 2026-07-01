import './global.css';
import React, { useEffect } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from './src/store/useAuthStore';
import { useThemeStore } from './src/store/useThemeStore';
import { useColorScheme } from 'nativewind';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from './src/db';
import migrations from './drizzle/migrations';
import { ActivityIndicator, View } from 'react-native';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from './src/api/anilist';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import AnimeDetailScreen from './src/screens/AnimeDetailScreen';
import RatingScreen from './src/screens/RatingScreen';
import CriteriaBuilderScreen from './src/screens/CriteriaBuilderScreen';
import CriteriaEditorScreen from './src/screens/CriteriaEditorScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

const CustomDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#09090b',
    card: '#09090b',
    border: '#27272a',
  },
};

const CustomLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#fafafa',
    card: '#ffffff',
    border: '#e4e4e7',
  },
};

export default function App() {
  const anilistToken = useAuthStore((state) => state.anilistToken);
  const themePref = useThemeStore((state) => state.theme);
  const { colorScheme, setColorScheme } = useColorScheme();
  const { success, error } = useMigrations(db, migrations);

  useEffect(() => {
    setColorScheme(themePref);
  }, [themePref, setColorScheme]);

  if (error) {
    console.error('Migration error:', error);
  }

  const isDark = colorScheme === 'dark' || (colorScheme === 'system' && themePref === 'system'); // Fallback if system isn't resolved immediately
  const bgColor = isDark ? '#09090b' : '#fafafa';
  const navTheme = isDark ? CustomDarkTheme : CustomLightTheme;

  if (!success) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: bgColor,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ApolloProvider client={apolloClient}>
      <NavigationContainer theme={navTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack.Navigator
          screenOptions={{ headerShown: false, contentStyle: { backgroundColor: bgColor } }}
        >
          {anilistToken ? (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen
                name="AnimeDetail"
                component={AnimeDetailScreen}
                options={{
                  headerShown: false,
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="Rating"
                component={RatingScreen}
                options={{
                  headerShown: true,
                  headerStyle: { backgroundColor: bgColor },
                  headerTintColor: isDark ? '#fff' : '#000',
                  title: 'Evaluación',
                }}
              />
              <Stack.Screen
                name="CriteriaBuilder"
                component={CriteriaBuilderScreen}
                options={{
                  headerShown: true,
                  headerStyle: { backgroundColor: bgColor },
                  headerTintColor: isDark ? '#fff' : '#000',
                  title: 'Packs de Criterios',
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="CriteriaEditor"
                component={CriteriaEditorScreen}
                options={{
                  headerShown: false,
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                  headerShown: true,
                  headerStyle: { backgroundColor: bgColor },
                  headerTintColor: isDark ? '#fff' : '#000',
                  title: 'Ajustes',
                  presentation: 'modal',
                }}
              />
            </>
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </ApolloProvider>
  );
}
