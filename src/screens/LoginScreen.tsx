import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {
  makeRedirectUri,
  useAuthRequest,
  ResponseType,
  exchangeCodeAsync,
  TokenResponse,
} from 'expo-auth-session';
import { useAuthStore } from '../store/useAuthStore';

// Required for web browser flow
WebBrowser.maybeCompleteAuthSession();

const anilistEndpoint = {
  authorizationEndpoint: 'https://anilist.co/api/v2/oauth/authorize',
  tokenEndpoint: 'https://anilist.co/api/v2/oauth/token',
};

export default function LoginScreen({ navigation }: any) {
  const setAnilistToken = useAuthStore((state) => state.setAnilistToken);
  const [isExchanging, setIsExchanging] = useState(false);

  const redirectUri = makeRedirectUri({
    scheme: 'scoremaker',
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_ANILIST_CLIENT_ID || 'dummy_id',
      scopes: [],
      redirectUri,
      responseType: ResponseType.Code,
      usePKCE: false,
    },
    anilistEndpoint,
  );

  useEffect(() => {
    const exchangeToken = async (code: string) => {
      try {
        setIsExchanging(true);

        const clientId = process.env.EXPO_PUBLIC_ANILIST_CLIENT_ID;
        const clientSecret = process.env.EXPO_PUBLIC_ANILIST_CLIENT_SECRET;

        if (!clientSecret) {
          Alert.alert(
            'Falta el Secret',
            'La app no detecta el EXPO_PUBLIC_ANILIST_CLIENT_SECRET. Por favor, asegúrate de reiniciar la terminal con "npm start -c".',
          );
          setIsExchanging(false);
          return;
        }

        const tokenResponse = await fetch('https://anilist.co/api/v2/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code: code,
          }),
        });

        const data = await tokenResponse.json();

        if (!tokenResponse.ok) {
          throw new Error(data.message || JSON.stringify(data));
        }

        if (data.access_token) {
          setAnilistToken(data.access_token);
          // React Navigation manejará el cambio al montar el nuevo stack
        }
      } catch (error: any) {
        Alert.alert('Error en AniList', error.message || 'Error intercambiando el código');
      } finally {
        setIsExchanging(false);
      }
    };

    if (response?.type === 'success') {
      const { code } = response.params;
      if (code) {
        exchangeToken(code);
      }
    } else if (response?.type === 'error') {
      Alert.alert('Authentication error', response.error?.message || 'Something went wrong');
    }
  }, [response]);

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950 items-center justify-center p-6">
      <Text className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">ScoreMaker</Text>
      <Text className="text-zinc-500 dark:text-zinc-400 text-center mb-10">
        Califica tus animes favoritos y sincroniza automáticamente con AniList
      </Text>

      {isExchanging ? (
        <ActivityIndicator size="large" color="#3b82f6" />
      ) : (
        <TouchableOpacity
          className="bg-blue-600 px-6 py-4 rounded-xl w-full flex-row items-center justify-center"
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Text className="text-white font-bold text-lg text-center">Login con AniList</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
