import './global.css';
import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from './src/store/useAuthStore';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from './src/db';
import migrations from './drizzle/migrations';
import { ActivityIndicator, View } from 'react-native';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from './src/api/anilist';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import RatingScreen from './src/screens/RatingScreen';
import CriteriaBuilderScreen from './src/screens/CriteriaBuilderScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const anilistToken = useAuthStore((state) => state.anilistToken);
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    console.error('Migration error:', error);
  }

  if (!success) {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ApolloProvider client={apolloClient}>
      <NavigationContainer theme={DarkTheme}>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#09090b' } }}>
          {anilistToken ? (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen 
                name="Rating" 
                component={RatingScreen} 
                options={{ 
                  headerShown: true, 
                  headerStyle: { backgroundColor: '#09090b' }, 
                  headerTintColor: '#fff', 
                  title: 'Evaluación' 
                }} 
              />
              <Stack.Screen 
                name="CriteriaBuilder" 
                component={CriteriaBuilderScreen} 
                options={{ 
                  headerShown: true, 
                  headerStyle: { backgroundColor: '#09090b' }, 
                  headerTintColor: '#fff', 
                  title: 'Packs de Criterios',
                  presentation: 'modal'
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
